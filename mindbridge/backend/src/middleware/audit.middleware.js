const winston = require('winston');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Dedicated logger for audit trails
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/audit.log'),
    }),
  ],
});

/**
 * Middleware to log mutating requests (POST/PUT/PATCH/DELETE)
 * Provides an audit trail for compliance.
 */
function auditLog(req, res, next) {
  // Only audit mutations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
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
    });
  }
  next();
}

module.exports = { auditLog };
