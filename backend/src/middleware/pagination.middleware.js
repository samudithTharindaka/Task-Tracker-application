const { parsePagination } = require('../utils/odata-parser.util');

// Lightweight page/limit-only pagination for plain-listing endpoints that
// don't need odata-query.middleware.js's $filter/$orderby machinery.
function pagination(req, res, next) {
  try {
    req.pagination = parsePagination(req.query);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { pagination };
