const logger = require('../config/logger');

class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Resource not found'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.issues,
      },
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: { message: 'A record with this value already exists', code: 'CONFLICT' },
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: { message: 'Resource not found', code: 'NOT_FOUND' },
    });
  }

  // Only unexpected/500+ failures are logged at error level here — expected
  // 4xx client errors (validation, not-found, forbidden, conflict) are
  // handled above and return before reaching this point.
  logger.error({ err, method: req.method, path: req.path }, 'Unhandled error');
  return res.status(500).json({
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
  });
}

module.exports = { ApiError, notFoundHandler, errorHandler };
