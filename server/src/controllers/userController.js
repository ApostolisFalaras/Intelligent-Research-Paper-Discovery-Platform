import { registerUser, loginUser, getUserMe, getUserHistory, getUserFolders } from "./../services/userService.js";

// User accesses their profile
export async function getMe(req, res) {
    try {
        // TODO: userId to be set after JWT authentication middleware
        const userId = 1;
        const profile = await getUserMe(userId);
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch user profile"})
    }
}

// User views its history of visited papers
export async function getHistory(req, res) {
    try {
        // TODO: userId to be set after JWT authentication middleware
        const userId = 1;
        const history = await fetchUserHistory(userId);
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch user history"});
    }
}

// User views its folders
export async function getFolders(req, res) {
    try {
        // TODO: userId to be set after JWT authentication middleware
        const userId = 1;
        const folders = await fetchUserFolders(userId);
        res.status(200).json(folders);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch user folders"});
    }
}