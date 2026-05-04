import { getPaperById, getPaperRecommendations } from "./../services/paperService.js";

// Retrieves a single paper from its url when accessed
export async function getPaperByIdController(req, res, next) {
    try {
        // TODO: AUTHENTICATION

        const paper = await getPaperById(req.params.id);
        
        // Successful retrieval of paper
        return res.status(200).json({
            status: "success",
            data: paper
        });

    } catch (error) {
        next(error);
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
