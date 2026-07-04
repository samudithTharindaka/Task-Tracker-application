const { parseODataQuery } = require('../utils/odata-parser.util');

function odataQuery(req, res, next) {
  try {
    const parsed = parseODataQuery(req.query);

    // Server-side enforced scoping: regular users can never see or filter
    // another user's tasks, regardless of what $filter they send.
    if (req.user.role === 'USER') {
      parsed.where.ownerId = req.user.id;
    }

    req.odataQuery = parsed;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { odataQuery };
