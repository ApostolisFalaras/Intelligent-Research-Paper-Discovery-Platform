import { fetchPaperById, fetchRecommendations } from "./../services/paperService.js";

// Retrieves a single paper from its url when accessed
export async function getPaper(req, res) {
    try {
        const paperId = req.params.id;
        const paper = await fetchPaperById(paperId);
        res.json(paper);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch paper."});
    }
}

// Retrieves recommendations based on a single paper,
// Finds most similar papers
export async function getPaperRecommendations(req, res) {
    try {
        const paperId = req.params.id;
        const papers = await fetchRecommendations(paperId);
        res.status(200).json(papers);
    } catch(error) {
        res.status(500).json({error: "Failed fetch paper recommendations"});
    }
}
