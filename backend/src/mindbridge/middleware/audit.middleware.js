const winston = require('winston');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../prisma');

// Reads of a student's personal data by staff or parents are logged too (DPDP Rules)
const SENSITIVE_READ = /\/(psychiatrist|admin\/students|admin\/schools\/[^/]+\/students|admin\/appointment-students|appointments\/[^/]+\/report|parent\/children)/;

// Dedicated logger for audit trails
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/audit.log'),
        handleExceptions: false,
      })
    ] : [])
  ],
});

/**
 * Middleware to log mutating requests (POST/PUT/PATCH/DELETE)
 * Provides an audit trail for compliance.
 */
function auditLog(req, res, next) {
  const mutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (mutation || (req.method === 'GET' && SENSITIVE_READ.test(req.originalUrl))) {
    // Capture response completion to get status code
    res.on('finish', () => {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        requestId: req.id || uuidv4(), // Fallback if req.id not set
        userId: req.user?.id || 'anonymous',
        role: req.user?.role || 'none',
        action: req.method,
        resource: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        statusCode: res.statusCode,
      };
      
      auditLogger.info('AUDIT', auditEntry);
      // Durable copy (the console log is not kept in production)
      prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          role: req.user?.role || null,
          method: req.method,
          path: String(req.originalUrl).split('?')[0].slice(0, 300),
          statusCode: res.statusCode,
          ip: auditEntry.ip ? String(auditEntry.ip).slice(0, 64) : null,
        },
      }).catch(() => {}); // never break a request over logging
    });
  }
  next();
}

module.exports = { auditLog };
