import { fetchAuthorById } from "./../services/authorService.js";

// Retrieve an author's profile info
export async function getAuthor(req, res) {
    try {
        const authorId = req.params.id;
        const author = await fetchAuthorById(authorId);
        res.json(author);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch author profile"});
    }
}
