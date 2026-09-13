import { 
    getAuthorById, 
    followAuthorService, 
    unfollowAuthorService } from "./../services/authorService.js";

    
// Retrieve an author's profile info
export async function getAuthorByIdController(req, res, next) {
    try {
        const author = await getAuthorById(req?.user?.id ?? null, req.params.id);

        res.status(200).json({
            status: "success",
            data: author
        });
    } catch (error) {
        next(error);
    }
}

// An authenticated user follows an author
export async function followAuthorController(req, res, next) {
    try {
        await followAuthorService(req.user.id, req.params.id);

        res.status(200).json({
            status: "success",
            message: `User ${req.user.id} followed author ${req.params.id} successfully.`
        });

    } catch (error) {
        next(error);
    }
}

// An authenticated user unfollows an author
export async function unfollowAuthorController(req, res, next) {
    try {
        await unfollowAuthorService(req.user.id, req.params.id);

        res.status(200).json({
            status: "success",
            message: `User ${req.user.id} unfollowed author ${req.params.id} successfully.`
        });

    } catch (error) {
        next(error);
    }
}