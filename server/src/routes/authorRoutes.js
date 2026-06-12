import express from "express";
import { getAuthorByIdController, getAuthorPapersController } from "./../controllers/authorController.js";


const router = express.Router();

// User views an author's profile 
router.get("/:id", getAuthorByIdController);

// User views an author's papers
router.get("/:id/papers", getAuthorPapersController);

export default router;