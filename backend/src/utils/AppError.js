// An error we throw on purpose; the error handler turns it into a clean JSON response.
class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details; // optional { field: 'message' } map for validation errors
    this.isAppError = true;
  }
}
module.exports = AppError;
