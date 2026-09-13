import express from "express";
import { 
	getAuthorByIdController, 
	followAuthorController,
	unfollowAuthorController } from "./../controllers/authorController.js";
import { authMiddleware, optionalAuthMiddleware } from "./../middlewares/authMiddleware.js";

const router = express.Router();

// User views an author's profile 
router.get("/:id", optionalAuthMiddleware, getAuthorByIdController);

// An authenticated user follows an author
router.post("/:id/follow", authMiddleware, followAuthorController);

// An authenticated user unfollows an author
router.post("/:id/unfollow", authMiddleware, unfollowAuthorController);

export default router;