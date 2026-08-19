const logger = require('./logger');

/**
 * Centralized error handler for controller catch blocks.
 * Logs the full error server-side; returns intentional messages for 4xx
 * errors and a generic message for 5xx to avoid leaking internals.
 *
 * @param {import('express').Response} res
 * @param {Error} err
 * @param {string} [context] - Optional context string for the log (e.g. 'createSchool')
 */
function handleError(res, err, context = '') {
  const status = err.status || 500;
  const prefix = context ? `[${context}] ` : '';

  // Always log the real error server-side
  if (status >= 500) {
    logger.error(`${prefix}${err.message}`, { stack: err.stack });
    console.error(`${prefix}${err.message}`, err.stack);
  } else {
    logger.warn(`${prefix}${err.message}`);
  }

  // Never expose internals to clients; keep intentional 4xx messages
  const clientMessage = status < 500 && err.message ? err.message : 'Internal server error';

  res.status(status).json({ error: clientMessage });
}

module.exports = { handleError };
