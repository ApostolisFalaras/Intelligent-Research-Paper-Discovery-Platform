import express from "express";
import { getAuthorByIdController } from "./../controllers/authorController.js";


const router = express.Router();

// User view an author's profile 
router.get("/:id", getAuthorByIdController);

export default router;