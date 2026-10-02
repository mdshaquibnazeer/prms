const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(404, 'The requested resource was not found.'));
}

// Central error handler: turns any error into a friendly JSON message.
// Raw database / stack-trace text is logged on the server but never sent to the user.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.isAppError) {
    return res.status(err.status).json({ success: false, message: err.message, errors: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'The request body is not valid JSON.' });
  }
  // PostgreSQL error codes
  switch (err.code) {
    case '23505':
      return res.status(409).json({ success: false, message: 'A record with this unique value already exists.' });
    case '23503':
      return res.status(400).json({ success: false, message: 'This record refers to, or is used by, another record that does not allow the change.' });
    case '23502':
    case '23514':
    case '22P02':
    case '22007':
    case '22008':
    case '22001':
      return res.status(400).json({ success: false, message: 'Some of the values are missing or in the wrong format.' });
    default:
  }
  console.error('[server error]', err);
  res.status(500).json({ success: false, message: 'Something went wrong on the server. Please try again.' });
}

module.exports = { notFound, errorHandler };
