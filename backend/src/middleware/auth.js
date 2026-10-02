const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/** Reads "Authorization: Bearer <token>", verifies it and puts the user on req.user. */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'Please log in to continue.'));
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    next(new AppError(401, 'Your session has expired. Please log in again.'));
  }
}

/** Role-based access control: authorize('admin', 'doctor') allows only those roles. */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError(401, 'Please log in to continue.'));
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'You do not have permission to do this.'));
  next();
};

module.exports = { authenticate, authorize };
