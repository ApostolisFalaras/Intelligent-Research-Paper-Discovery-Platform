// Custom error class used by global error-handling middleware
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = String(statusCode).startsWith("4") ? "fail": "error";

        // Remove constructor from stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}