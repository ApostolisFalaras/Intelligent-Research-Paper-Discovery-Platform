import express from "express";
import { getMe, 
         getSearchHistoryController, 
         deleteSearchHistoryController, 
         getFoldersController,
         createFolderController,
         deleteFolderController } from "./../controllers/userController.js";

const router = express.Router();

// User views their profile
router.get("/me", getMe);

// User views their search history
router.get("/me/search-history", getSearchHistoryController);

// User deletes a single search history record
router.delete("/me/search-history/:id", deleteSearchHistoryController);

// User views their project folders
router.get("/me/folders", getFoldersController);

// User creates a new project folder
router.post("/me/folders", createFolderController);

// User removes a project folder
router.delete("/me/folders/:id", deleteFolderController);

export default router;