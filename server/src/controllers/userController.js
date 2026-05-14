import { getUserMe, getUserSearchHistory, 
         deleteUserSearchHistoryById, getUserFolders } from "./../services/userService.js";
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
export async function getSearchHistoryController(req, res, next) {
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

// User deletes a single search history record by id
export async function deleteSearchHistoryController(req, res, next) {
    try {
        // Using req.user.id since this operation is available
        // only if the user is authenticated
        await deleteUserSearchHistoryById(req.user.id, req.params.id);

        res.status(200).json({
            status: "success",

        });
    } catch (error) {
        next(error);
    }
}

// User views its folders
export async function getFolders(req, res) {}