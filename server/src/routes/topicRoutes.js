import express from "express";
import { getTopicByIdController, getTopicPapersController } from "./../controllers/topicController.js";

const router = express.Router();

// User view a particular topic's page
router.get("/:id", getTopicByIdController);

// User views papers related to the current topic
router.get("/:id/papers", getTopicPapersController);

export default router;