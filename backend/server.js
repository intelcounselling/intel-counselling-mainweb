import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env.local file or local .env
// (must happen before importing modules that read process.env at load time)
dotenv.config({ path: join(__dirname, '../.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

// Fail fast in production when required secrets are missing. Without this, the
// server boots fine but every auth endpoint (login/register) returns an opaque
// 500 "Internal Server Error" at request time when signToken() throws.
if (process.env.NODE_ENV === 'production' && !process.env.AUTH_TOKEN_SECRET) {
  console.error(
    'FATAL: AUTH_TOKEN_SECRET environment variable must be set in production. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
  process.exit(1);
}


const { default: apiRouter } = await import('./src/routes/api.js');
const { default: mindbridgeApp } = await import('./src/mindbridge/app.js');

const app = express();

// Behind a reverse proxy (Vercel/nginx), req.ip must reflect the real client
// so rate limiting keys correctly.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Restrict CORS to configured origins in production; default stays permissive for dev.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));

// Keep the raw request bytes alongside the parsed body — Cashfree webhook
// signature verification must run over the exact raw payload.
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));

// Main API routing mount
app.use('/api', apiRouter);

// Mount Mindbridge (Student Portal) API under /api/portal
app.use('/api/portal', mindbridgeApp);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Unified Backend API Server running on port ${PORT}`);
});
