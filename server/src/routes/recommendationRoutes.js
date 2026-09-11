import express from "express";
import { 
	getHomeRecommendationsController,
	getRecommendationsPageController
} from "./../controllers/recommendationController.js";
import { optionalAuthMiddleware } from "./../middlewares/authMiddleware.js";


const router = express.Router();

// Fetch home recommendations with top-5 suggestions of each category of recommendation
router.get("/home", optionalAuthMiddleware, getHomeRecommendationsController);

// Fetch recommendations based on similar papers the user interacted with
router.get("/", optionalAuthMiddleware, getRecommendationsPageController);

export default router;