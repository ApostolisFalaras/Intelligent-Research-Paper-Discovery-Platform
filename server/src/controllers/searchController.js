import { searchPapers } from "./../services/searchService.js";

// Perform a user's query from the main search bar
export async function searchPapersController(req, res) {
    try {
        // TODO: AUTHENTICATION

        // Validate search bar's input query
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Search query is required"
            });
        }

        const papers = await searchPapers(q);

        res.status(200).json({
            status: "success",
            data: papers
        });
    
    } catch (error) {
        // Internal server error
        console.error("Search Controller Error:", error);

        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}