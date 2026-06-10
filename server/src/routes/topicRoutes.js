import express from "express";
import { getTopicByIdController } from "./../controllers/topicController.js";

const router = express.Router();

// User view a particular topic's page
router.get("/:id", getTopicByIdController);

export default router;