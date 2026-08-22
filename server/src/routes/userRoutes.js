import express from "express";
import { avatarUpload } from "./../middlewares/avatarUpload.js";
import { getMe, 
         getMyProfileController,
         patchMyProfileController,
         deleteMyProfileController,
         postMyAvatarController,
         deleteMyAvatarController,
         getSearchHistoryController, 
         deleteSearchHistoryController, 
         getFoldersController,
         createFolderController,
         patchFolderController,
         deleteFolderController,
         getPapersFromFolderController,
         addPapertoFolderController,
         deletePaperFromFolderController } from "./../controllers/userController.js";

const router = express.Router();

// User views their profile
router.get("/me", getMe);

// User retrieves their profile info: activity totals, recent activity, top folders, recent followed authors
router.get("/me/profile", getMyProfileController);

// User modifies their profile info
router.patch("/me/profile", patchMyProfileController);

// User deletes their profile
router.delete("/me/profile", deleteMyProfileController);

// User uploads an avatar image
router.post("/me/profile/avatar", avatarUpload.single("avatar"), postMyAvatarController);

// User deletes their avatar image
router.delete("/me/profile/avatar", deleteMyAvatarController);

// User views their search history
router.get("/me/search-history", getSearchHistoryController);

// User deletes a single search history record
router.delete("/me/search-history/:id", deleteSearchHistoryController);

// User views their project folders
router.get("/me/folders", getFoldersController);

// User creates a new project folder
router.post("/me/folders", createFolderController);

// User updates a folder's metadata
router.patch("/me/folders/:id", patchFolderController);

// User removes a project folder
router.delete("/me/folders/:id", deleteFolderController);

// User fetches the papers of a project folder
router.get("/me/folders/:id/papers", getPapersFromFolderController);

// User adds a paper to a project folder
router.post("/me/folders/:folderId/papers/:paperId", addPapertoFolderController);

// User deletes a paper from a project folder
router.delete("/me/folders/:folderId/papers/:paperId", deletePaperFromFolderController);

export default router;