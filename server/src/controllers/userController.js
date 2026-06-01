import { getUserMe, 
         getUserSearchHistory, 
         deleteUserSearchHistoryById, 
         getProjectFoldersById, 
         createProjectFolderById, 
         patchProjectFolderById,
         deleteProjectFolderById,
         getPapersFromFolderById,
         addPapertoFolderById,
         deletePaperFromFolderById } from "./../services/userService.js";
import { AppError } from "./../utils/AppError.js";

// User accesses their profile
export async function getMe(req, res, next) {
    try {
        const profile = await getUserMe(req.user.id);

        res.status(200).json({
            status: "success",
            data: profile
        });
    } catch (error) {
        next(error);
    }
}

// User views its history of visited papers
export async function getSearchHistoryController(req, res, next) {
    try {
        // Query parameters contain pagination filters
        const searchHistory = await getUserSearchHistory(req.user.id, req.query);

        res.status(200).json({
            status: "success",
            data: { 
                history: searchHistory 
            }
        });
    } catch (error) {
        next(error);
    }
}

// User deletes a single search history record by id
export async function deleteSearchHistoryController(req, res, next) {
    try {
        // Using req.user.id since this operation is available
        // only if the user is authenticated
        await deleteUserSearchHistoryById(req.user.id, req.params.id);

        res.status(200).json({
            status: "success",
            message: "Search history record deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

// User views its folders
export async function getFoldersController(req, res, next) {
    try {
        // req.user.id exists since the user is authenticated
        const projectFolders = await getProjectFoldersById(req.user.id);

        res.status(200).json({
            status: "success",
            data: {
                folders: projectFolders
            },
        });
    } catch (error) {
        next(error);
    }
}

// User creates a new project folder
export async function createFolderController(req, res, next) {
    try {
        // req.user.id exists because the user is authenticated
        // req.body contains the project folder metadata
        await createProjectFolderById(req.user.id, req.body);

        res.status(201).json({
            status: "success",
            message: "Project folder created successfully"
        });
    } catch (error) {
        next(error);
    }
}

// User updates a project folder's metadata
export async function patchFolderController(req, res, next) {
    try {
        await patchProjectFolderById(req.user.id, req.params.id, req.body);

        res.status(200).json({
            status: "success",
            message: "Project folder updated successfully"
        });

    } catch (error) {
        next(error);
    }
}

// User removes a project folder
export async function deleteFolderController(req, res, next) {
    try {
        await deleteProjectFolderById(req.user.id, req.params.id);

        res.status(200).json({
            status: "success",
            message: "Project folder deleted successfully"
        });
    } catch (error) {
        next(error);
    }
}

// User accesses the papers of a project folder
export async function getPapersFromFolderController(req, res, next) {
    try {
        const papers = await getPapersFromFolderById(req.user.id, req.params.id);

        res.status(200).json({
            status: "success",
            data: papers
        });
    } catch (error) {
        next(error);
    }
}

// User adds paper to a project folder
export async function addPapertoFolderController(req, res, next) {
    try {
        await addPapertoFolderById(req.user.id, req.params.folderId, req.params.paperId);

        res.status(201).json({
            status: "success",
            message: "Paper added to project folder successfully"
        });
    } catch (error) {
        next(error);
    }
}

// User deletes paper from project folder
export async function deletePaperFromFolderController(req, res, next) {
    try {
        await deletePaperFromFolderById(req.user.id, req.params.folderId, req.params.paperId);

        res.status(200).json({
            status: "success",
            message: "Paper deleted from project folder successfully"
        });
    } catch (error) {
        next(error);
    }
}