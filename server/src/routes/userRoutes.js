import express from "express";
import { getMe, getHistory, getFolders } from "./../controllers/userController.js";

const router = express.Router();

// User views their profile
router.get("/me", getMe);

// User views their search history
router.get("/me/history", getHistory);

// User views their folders
router.get("/me/folders", getFolders);

export default router;