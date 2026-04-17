import { fetchPapers } from "./../services/searchService.js";

// Perform a user's query from the main search bar
export async function searchPapers(req, res) {
    try {
        const filters = req.query;
        const papers = await fetchPapers(filters);
        res.status(200).json(papers);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch search results"});
    }
}