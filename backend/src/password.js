import crypto from 'crypto';

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LEN = 64;

// Hash format: scrypt$<saltHex>$<hashHex>
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

// Supports both the new scrypt format and legacy unsalted SHA-256 hashes.
export function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string' || !storedHash) return { valid: false, needsUpgrade: false };

  if (storedHash.startsWith('scrypt$')) {
    const [, saltHex, hashHex] = storedHash.split('$');
    if (!saltHex || !hashHex) return { valid: false, needsUpgrade: false };
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, SCRYPT_PARAMS);
    const valid = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    return { valid, needsUpgrade: false };
  }

  // Legacy: plain SHA-256 hex digest
  const legacy = crypto.createHash('sha256').update(password).digest('hex');
  const a = Buffer.from(legacy);
  const b = Buffer.from(storedHash);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { valid, needsUpgrade: valid };
}
