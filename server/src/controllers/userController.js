import { registerUser, loginUser, fetchUserProfile, fetchUserHistory, fetchUserFolders } from "./../services/userService.js";

// User signs up in the app
export async function register(req, res) {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const isRegistered = await registerUser(username, password);
        // TODO: Assign JWT to user
        res.status(201).json({isRegistered});
    } catch (error) {
        res.status(500).json({error: "Failed to register the user"});
    }
}

// User logs in the app
export async function login(req, res) {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const isLoggedIn = await loginUser(username, password);
        // TODO: Assign JWT to user
        res.status(200).json({isLoggedIn});
    } catch (error) {
        res.status(500).json({error: "Faild to login the user"});
    }
}

// User accesses their profile
export async function getProfile(req, res) {
    try {
        // TODO: userId to be set after JWT authentication middleware
        const userId = 1;
        const profile = await fetchUserProfile(userId);
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