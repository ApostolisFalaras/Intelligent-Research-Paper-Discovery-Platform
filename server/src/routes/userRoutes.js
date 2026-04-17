import express from "express";
import { register, login, getProfile, getHistory, getFolders } from "./../controllers/userController.js";

const router = express.Router();

// User signs up in the app
router.post("/register", register);

// User logins in the app
router.post("/login", login);

// User views their profile
router.get("/me", getProfile);

// User views their search history
router.get("/me/history", getHistory);

// User views their folders
router.get("/me/folders", getFolders);

export default router;