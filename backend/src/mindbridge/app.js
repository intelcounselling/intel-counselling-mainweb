require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { verifyToken } = require('./middleware/auth.middleware');
const { auditLog } = require('./middleware/audit.middleware');
const routes = require('./routes');

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request IDs ───────────────────────────────────────────────
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// ── Authenticated Static Files (uploads) ───────────────────────
// Only authenticated users can access uploaded files
app.use('/uploads', verifyToken, express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// ── Request Logging ───────────────────────────────────────────
app.use((req, res, next) => {
  logger.debug(`[${req.id}] ${req.method} ${req.path}`);
  next();
});

app.use(auditLog);

// ── API Routes ────────────────────────────────────────────────
app.use('/api', apiLimiter, routes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

module.exports = app;
