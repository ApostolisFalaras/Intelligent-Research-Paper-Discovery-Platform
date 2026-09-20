import { searchPapers } from "./../services/searchService.js";

// Perform a user's query from the main search bar
export async function searchPapersController(req, res, next) {
    try {
        // User id only exists for authenticated users
        const papers = await searchPapers(req.query);

        res.status(200).json({
            status: "success",
            data: papers
        });
    
    } catch (error) {
        next(error);
    }
}