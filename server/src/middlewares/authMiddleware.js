import { AppError } from "./../utils/AppError.js";

export function authMiddleware(req, res, next) {
    // Validating session and userId existence (if session exists)
    if (!req.session?.userId) {
        next(new AppError("User not authenticated", 401));
    }

    req.user = { 
        id: req.session.userId,
    }
    next();
}