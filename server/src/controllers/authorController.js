import { getAuthorById, getAuthorPapers } from "./../services/authorService.js";

// Retrieve an author's profile info
export async function getAuthorByIdController(req, res, next) {
    try {
        const author = await getAuthorById(req.params.id);

        res.status(200).json({
            status: "success",
            data: author
        });
    } catch (error) {
        next(error);
    }
}

// Retrieve an author's associated papers
export async function getAuthorPapersController(req, res, next) {
    try {
        const papers = await getAuthorPapers(req.params.id, req.query);

        res.status(200).json({
            status: "success",
            data: papers
        });
    } catch (error) {
        next(error);
    }
}
