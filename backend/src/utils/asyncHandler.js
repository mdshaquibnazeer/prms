// Lets async route handlers throw errors without try/catch in every controller.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
