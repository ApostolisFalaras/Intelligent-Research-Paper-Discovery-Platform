import { getUserMe, getUserHistory, getUserFolders } from "./../services/userService.js";

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
export async function getHistory(req, res) {}

// User views its folders
export async function getFolders(req, res) {}