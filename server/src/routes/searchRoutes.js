import express from "express";
import { searchPapers } from "./../controllers/searchController.js";

const router = express.Router();

// User performs a search query in the main search bar
router.get("/", searchPapers);

export default router;