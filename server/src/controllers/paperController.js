import { getPaperById, getPaperRecommendations } from "./../services/paperService.js";

// Retrieves a single paper from its url when accessed
export async function getPaperByIdController(req, res) {
    try {
        // TODO: AUTHENTICATION
        
        // Validate input id
        const paperId = req.params.id;

        if (!paperId || typeof paperId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Invalid paper Id"
            });
        }

        const paper = await getPaperById(paperId);

        // Validate if the paper exists
        if (!paper) {
            return res.status(404).json({
                status: "error",
                message: "Paper not found"
            });
        }
        
        // Successful retrieval of paper
        return res.status(200).json({
            status: "success",
            data: paper
        });

    } catch (error) {
        // Internal server error
        console.error("Paper Controller Error:", error);

        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}

// Retrieves recommendations based on a single paper,
// Finds most similar papers
export async function getPaperRecommendationsController(req, res) {
    try {
        const paperId = req.params.id;
        const papers = await getPaperRecommendations(paperId);
        res.status(200).json(papers);
    } catch(error) {
        res.status(500).json({error: "Failed fetch paper recommendations"});
    }
}
