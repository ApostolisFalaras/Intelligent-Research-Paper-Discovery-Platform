import express from "express";
import { getExploreContentController, getExploreTopicController } from "./../controllers/exploreController.js";

const router = express.Router();

// Explores a preview a randomly selected set of topics and their preview papers
router.get("/", getExploreContentController);

// Explores a particular topic by fetching paginated sets of papers belonging in it
router.get("/:id", getExploreTopicController); 

export default router;