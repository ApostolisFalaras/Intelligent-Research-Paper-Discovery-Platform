import express from "express";
import { getMe, 
         getSearchHistoryController, 
         deleteSearchHistoryController, 
         getFoldersController } from "./../controllers/userController.js";

const router = express.Router();

// User views their profile
router.get("/me", getMe);

// User views their search history
router.get("/me/search-history", getSearchHistoryController);

// User deletes a single search history record
router.delete("/me/search-history/:id", deleteSearchHistoryController);

// User views their folders
router.get("/me/folders", getFoldersController);

export default router;