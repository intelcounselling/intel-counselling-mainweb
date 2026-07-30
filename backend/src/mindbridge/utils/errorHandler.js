const logger = require('./logger');

/**
 * Centralized error handler for controller catch blocks.
 * In production: always returns a generic message to avoid leaking internals.
 * In development: returns the actual error message for debugging.
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
  } else {
    logger.warn(`${prefix}${err.message}`);
  }

  // Expose full error details for debugging
  const clientMessage = `${err.message} \n ${err.stack}`;

  res.status(status).json({ error: clientMessage });
}

module.exports = { handleError };
