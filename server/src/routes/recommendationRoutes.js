import express from "express";
import { 
	getHomeRecommendationsController,
	getContentRecommendationsController,
	getUserRecommendationsController,
	getTopicRecommendationsController
} from "./../controllers/recommendationController.js";
import { authMiddleware, optionalAuthMiddleware } from "./../middlewares/authMiddleware.js";


const router = express.Router();

// Fetch home recommendations with top-5 suggestions of each category of recommendation
router.get("/home", optionalAuthMiddleware, getHomeRecommendationsController);

// Fetch recommendations based on similar papers the user interacted with
router.get("/content-based", authMiddleware, getContentRecommendationsController);

// Fetch recommendations based on similar users activity
router.get("/user-based", authMiddleware, getUserRecommendationsController);

// Fetch recommendations based on a particular topic
router.get("/topic-based", authMiddleware, getTopicRecommendationsController);

export default router;