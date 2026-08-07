import express from "express";
import { getPaperByIdController, getPaperRecommendationsController } from "./../controllers/paperController.js"; 
import { 
	recordPaperViewController, 
	recordPaperSaveController, 
	recordPaperUnsaveController } from "./../controllers/userActivityController.js";
import { authMiddleware } from "./../middlewares/authMiddleware.js";

const router = express.Router();

// User accesses an individual paper from the retrieved search results
router.get("/:id", getPaperByIdController);

// User requests recommendations based on the currently viewed paper
router.get("/:id/similar", getPaperRecommendationsController);

// Records a user view on a particular paper
router.post("/:id/view", authMiddleware, recordPaperViewController);

// Records a user save on a particular paper
router.post("/:id/save", authMiddleware, recordPaperSaveController);

// Records a user unsave on a particular paper
router.post("/:id/unsave", authMiddleware, recordPaperUnsaveController);

export default router;