import express from "express";
import { searchPapersController } from "./../controllers/searchController.js";

const router = express.Router();

// User performs a search query in the main search bar
router.get("/", searchPapersController);

export default router;