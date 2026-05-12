import { getUserMe, getUserSearchHistory, getUserFolders } from "./../services/userService.js";
import { AppError } from "./../utils/AppError.js";

// User accesses their profile
export async function getMe(req, res, next) {
    try {
        const profile = await getUserMe(req.user.id);

        res.status(200).json({
            status: "success",
            data: profile
        });
    } catch (error) {
        next(error);
    }
}

// User views its history of visited papers
export async function getSearchHistory(req, res, next) {
    try {
        // Query parameters contain pagination filters
        const searchHistory = await getUserSearchHistory(req.user.id, req.query);

        res.status(200).json({
            status: "success",
            data: { 
                history: searchHistory 
            }
        });
    } catch (error) {
        next(error);
    }
}

// User views its folders
export async function getFolders(req, res) {}