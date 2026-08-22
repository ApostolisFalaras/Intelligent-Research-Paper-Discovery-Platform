import { getPaperById, paperIsSaved, getPaperSavedFolders } from "./../services/paperService.js";


// Retrieves a single paper from its url when accessed
export async function getPaperByIdController(req, res, next) {
    try {
        const paper = await getPaperById(req.params.id);

        let isSaved = false;
        if (req.session.userId) {
            isSaved = await paperIsSaved(req.session.userId, paper.internalId);
        }

        // Successful retrieval of paper
        return res.status(200).json({
            status: "success",
            data: {
                ...paper,
                isSaved
            }
        });

    } catch (error) {
        next(error);
    }
}

// Retrieves the folders a specific paper is saved in
export async function getPaperSavedFoldersController(req, res, next) {
    try {
        const folders = await getPaperSavedFolders(req.session.userId, req.params.id);

        return res.status(200).json({
            status: "success",
            data: {
                folders
            }
        });
    } catch(error) {
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
        next(error);
    }
}
