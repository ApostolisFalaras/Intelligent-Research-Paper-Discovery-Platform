import { login, register } from "./../services/authService.js";
import { updateUserLoginTime } from "./../services/userService.js";

// User logs in 
export async function loginController(req, res, next) {
    try {
        const user = await login(req.body);

        req.session.userId = user.id;

        updateUserLoginTime(req.session.userId);

        // Successful retrieval of user credentials
        return res.status(200).json({
            status: "success",
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
}

// User registers
export async function registerController(req, res, next) {
    try {
        const user = await register(req.body);

        req.session.userId = user.id;

        // Successful creation of user credentials
        return res.status(201).json({
            status: "success",
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
}

// User logs out
export async function logoutController(req, res, next) {
    // Case when session already doesn't exist
    if (!req.session) {
        res.clearCookie("sid");

        return res.status(200).json({
            status: "success",
            message: "Logged out successfully"
        });
    }

    // Case when session exists
    req.session.destroy((error) => {
        if (error)
            return next(error);

        // Deleting cookie from the browser
        res.clearCookie("sid");

        return res.status(200).json({
            status: "success",
            message: "Logged out successfully"
        });
    });
}