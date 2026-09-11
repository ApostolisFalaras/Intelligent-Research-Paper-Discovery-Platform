import express from "express";
import { getAllTopicsController } from "./../controllers/topicController.js";

const router = express.Router();

// The app fetches all topics for the "Topic" dropdown search filter
router.get("/all", getAllTopicsController);

export default router;