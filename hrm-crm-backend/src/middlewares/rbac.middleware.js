const { AppError } = require('./error.middleware');

const authorize = (...permissions) => {
  return (req, res, next) => {
    const userPermissions = req.user?.permissions || [];
    const hasPermission = permissions.some(p => userPermissions.includes(p));
    if (!hasPermission) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('Access denied for your role', 403));
    }
    next();
  };
};

module.exports = { authorize, authorizeRoles };
