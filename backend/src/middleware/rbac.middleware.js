const { ApiError } = require('./error.middleware');
const logger = require('../config/logger');

function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user.id, role: req.user.role, allowedRoles, path: req.path },
        'Forbidden: insufficient role',
      );
      return next(new ApiError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }

    next();
  };
}

module.exports = { authorize };
