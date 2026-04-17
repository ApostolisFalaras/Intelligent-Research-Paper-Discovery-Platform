import express from "express";
import { getPaper, getPaperRecommendations } from "./../controllers/paperController.js"; 

const router = express.Router();

// User accesses an individual paper from the retrieved search results
router.get("/:id", getPaper);

// User requests recommendations based on the currently viewed paper
router.get("/:id/recommendations", getPaperRecommendations);

export default router;