/**
 * Pagination helpers for offset-based pagination.
 */

/**
 * Parse pagination params from query string.
 * @param {Object} query - Express req.query
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
}

/**
 * Build pagination metadata for response.
 * @param {number} total - Total record count
 * @param {number} page
 * @param {number} limit
 * @returns {{ total, page, limit, pages, hasNext, hasPrev }}
 */
function buildPaginationMeta(total, page, limit) {
  const pages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

module.exports = { parsePagination, buildPaginationMeta };
