// Global error-handling middleware defined after all routes,
// to capture all potential errors
export function errorHandler(err, req, res, next) {
    console.log(err);

    // Using the 500 error as fallback
    const statusCode = err.statusCode || 500;
    const status = err.status || "error";

    res.status(statusCode).json({
        status: status,
        message: err.message || "Internal server error",
    });
}