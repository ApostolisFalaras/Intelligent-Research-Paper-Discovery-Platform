import express from "express";
import { getAuthor } from "./../controllers/authorController.js";

const router = express.Router();

// User view an author's profile 
router.get("/:id", getAuthor);

export default router;