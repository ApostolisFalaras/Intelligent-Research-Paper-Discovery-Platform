import express from "express";
import { getTopicByIdController, 
		 getTopicPapersController,
		 getAllTopicsController } from "./../controllers/topicController.js";

const router = express.Router();

// The app fetches all topics for the "Topic" dropdown search filter
router.get("/all", getAllTopicsController);

// User view a particular topic's page
router.get("/:id", getTopicByIdController);

// User views papers related to the current topic
router.get("/:id/papers", getTopicPapersController);

export default router;