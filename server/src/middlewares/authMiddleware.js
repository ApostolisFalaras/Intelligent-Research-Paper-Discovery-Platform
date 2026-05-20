import { AppError } from "./../utils/AppError.js";

// Mandatory authenticaiton for user and paper recommendation routes
export function authMiddleware(req, res, next) {
    // Validating session and userId existence (if session exists)
    if (!req.session?.userId) {
        return next(new AppError("User not authenticated", 401));
    }

    req.user = { 
        id: req.session.userId,
    }
    return next();
}

// Optional authentication for search queries that are added to the user search history
export function optionalAuthMiddleware(req, res, next) {
    if(!req.session?.userId) {
        req.user = null;
        return next();
    }

    req.user = {
        id: req.session.userId
    };

    return next();
}