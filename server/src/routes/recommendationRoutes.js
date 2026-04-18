import express from "express";
import { getHomeRecommendations, 
         getContentBasedRecommendations, 
         getUserBasedRecommendations,
         getTopicRecommendations } from "./../controllers/recommendationController.js";

const router = express.Router();

// Recommendations that appear when in the home page
router.get("/home", getHomeRecommendations);

// User views recommendations based on its history of papers they've viewed
router.get("/content-based/:id", getContentBasedRecommendations);

// User views recommendations based on other users with similar interests
router.get("/collaborative", getUserBasedRecommendations);

// User views recommendations based on a particular topic
router.get("/topic-based/:topic", getTopicRecommendations);

export default router;