import crypto from 'crypto';
import { getUserById } from './db.js';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret() {
  const rawSecret = process.env.AUTH_TOKEN_SECRET;
  if (!rawSecret) {
    // Refuse to sign real sessions with a secret that lives in git history.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_TOKEN_SECRET environment variable must be set in production');
    }
    console.warn('WARNING: AUTH_TOKEN_SECRET not set — using insecure dev-only fallback secret');
    return crypto.createHash('sha256').update('intel_counselling_default_dev_token_secret!').digest();
  }
  return crypto.createHash('sha256').update(rawSecret).digest();
}

function hmac(payloadB64) {
  return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest();
}

export function signToken(userId, tokenVersion = 0) {
  const now = Date.now();
  const payload = JSON.stringify({ sub: userId, iat: now, exp: now + TOKEN_TTL_MS, ver: tokenVersion || 0 });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = hmac(payloadB64).toString('base64url');
  return `${payloadB64}.${signature}`;
}

// Verifies signature + expiry and returns the full payload ({ sub, iat, exp, ver? }), or null.
function verifyTokenPayload(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 4096) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }
  const [payloadB64, signatureB64] = parts;
  try {
    const expected = hmac(payloadB64);
    const provided = Buffer.from(signatureB64, 'base64url');
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload || typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
      return null;
    }
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

export function verifyToken(token) {
  const payload = verifyTokenPayload(token);
  return payload ? payload.sub : null;
}

function extractBearerToken(req) {
  const header = req.headers && req.headers.authorization;
  if (!header || typeof header !== 'string') {
    return null;
  }
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }
  return match[1].trim();
}

// Extracts and verifies a Bearer token from an incoming request.
// Returns the authenticated userId, or null if missing/invalid/expired.
// NOTE: signature/expiry only — does not check server-side revocation.
// Prefer authenticateRequest() for endpoints that must honor logout-all.
export function getAuthenticatedUserId(req) {
  const token = extractBearerToken(req);
  return token ? verifyToken(token) : null;
}

// Full authentication: verifies the token AND checks it against the user's
// current token_version, so tokens issued before a "logout everywhere" bump
// are rejected. Tokens signed before versioning existed carry no `ver` and
// are treated as ver 0, matching the column default.
export async function authenticateRequest(req) {
  const token = extractBearerToken(req);
  if (!token) {
    return null;
  }
  const payload = verifyTokenPayload(token);
  if (!payload) {
    return null;
  }
  const user = await getUserById(payload.sub);
  if (!user) {
    return null;
  }
  const tokenVer = typeof payload.ver === 'number' ? payload.ver : 0;
  const currentVer = user.token_version == null ? 0 : user.token_version;
  if (tokenVer !== currentVer) {
    return null;
  }
  return payload.sub;
}
