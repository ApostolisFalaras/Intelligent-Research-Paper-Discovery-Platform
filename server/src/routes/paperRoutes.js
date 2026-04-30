import express from "express";
import { getPaperByIdController, getPaperRecommendationsController } from "./../controllers/paperController.js"; 

const router = express.Router();

// User accesses an individual paper from the retrieved search results
router.get("/:id", getPaperByIdController);

// User requests recommendations based on the currently viewed paper
router.get("/:id/similar", getPaperRecommendationsController);

export default router;