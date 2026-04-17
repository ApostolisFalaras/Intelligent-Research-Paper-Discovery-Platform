import express from "express";
import { getHomeRecommendations, 
         contentBasedRecommendations, 
         userBasedRecommendations } from "./../controllers/recommendationController.js";

const router = express.Router();

// Recommendations that appear when in the home page
router.get("/home", getHomeRecommendations);

// User views recommendations based on its history of papers they've viewed
router.get("/content-based/:id", contentBasedRecommendations);

// User views recommendations based on other users with similar interests
router.get("/collaborative", userBasedRecommendations);

export default router;