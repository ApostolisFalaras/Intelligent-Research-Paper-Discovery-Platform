import { getAuthorById } from "./../services/authorService.js";

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
