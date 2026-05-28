import { fetchUserById } from "./../repositories/userRepository.js";
import { fetchUserSearchHistory, deleteFromSearchHistory } from "./../repositories/userHistoryRepository.js";
import { fetchProjectFoldersById, 
         createProjectFolder, 
         updateProjectFolder,
         deleteProjectFolder } from "../repositories/userFolderRepository.js";
import { parseUserId, parseInteger, parseString, parseBoolean } from "../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";

// Helper function that parses User id

// User accesses their profile page
export async function getUserMe(id) {
    // Validate user id
    const parsedId = parseUserId(id);

    const userProfile = await fetchUserById(parsedId);

    // Validate if user profile exists for the provided user id
    if (!userProfile)
        throw new AppError("User profile not found", 404);

    // user profile Data Transfer Object (DTO)
    return {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        affiliation: userProfile.affiliation,
        role: userProfile.role,
        bio: userProfile.bio,
        createdAt: userProfile.created_at,
        updatedAt: userProfile.updated_at 
    };
}

// User fetches their search history
export async function getUserSearchHistory(userId, filters) {
    // Validate user id
    const parsedId = parseUserId(userId);

    // Validate pagination filters
    const pagination = validatePagination(filters);

    const searchHistory = await fetchUserSearchHistory(parsedId, pagination);

    // Converting search history records to a DTO
    return searchHistory.map((record) => ({
        id: record.id,
        userId: record.user_id,
        query: record.query,
        filters: record.filters,
        resultCount: record.result_count,
        createdAt: record.created_at
    }));

}

// Helper function
function validatePagination(paginationFilters) {
    const page = parseInteger(paginationFilters?.page, "page") ?? 1;
    const limit = parseInteger(paginationFilters?.limit, "limit") ?? 25;

    if (page < 1)
        throw new AppError("'page' must be greater than or equal to 1", 400);

    if (limit < 1 || limit > 100)
        throw new AppError("'limit' must be between 1 and 100", 400);

    return {
        page,
        limit,
        offset: (page - 1) * limit
    };
}

// User deletes a single search history record by id
export async function deleteUserSearchHistoryById(user_id, id) {
    // Validate user id
    const parsedUserId = parseUserId(user_id);

    const parsedRecordId = parseInteger(id, 'history record id');

    if (!parsedRecordId || parsedRecordId < 1) {
        throw new AppError("Search history record id is required", 400);
    }

    const deletedRows = await deleteFromSearchHistory(parsedUserId, parsedRecordId);

    if (deletedRows === 0)
        throw new AppError("Search history record not found", 404);

}

// User fetches their folders
export async function getProjectFoldersById(userId) {
    // Validate user id
    const parsedId = parseUserId(userId);

    const userProjectFolders = await fetchProjectFoldersById(parsedId);

    return userProjectFolders.map((folder) => ({
        id: folder.id,
        userId: folder.user_id,
        name: folder.name,
        summary: folder.summary,
        paperCount: folder.paper_count,
        isPinned: folder.is_pinned,
        color: folder.color,
        visibility: folder.visibility,
        icon: folder.icon,
        createdAt: folder.created_at,
        updatedAt: folder.updated_at
    }));

}

// User creates a new project folder
export async function createProjectFolderById(userId, folderData) {
    // Validate user id
    const parsedId = parseUserId(userId);

    // Validate project folder metadata
    const parsedFolderData = validateProjectFolderData(folderData);

    const insertedFolders = await createProjectFolder(parsedId, parsedFolderData);

    if (insertedFolders === 0)
        throw new AppError("Project folder was not inserted", 500);
}

// Helper function that validates the new project folder's metadata
function validateProjectFolderData(folderData) {
    const name = parseString(folderData.name, "name");
    if (!name)
        throw new AppError("'name' is required", 400);

    return {
        name,
        summary: parseString(folderData?.summary, "summary"),
        visibility: parseString(folderData?.visibility, "visibility") ?? "private",
        color: parseString(folderData?.color, "color"),
        icon: parseString(folderData?.icon, "icon"),
        isPinned: parseBoolean(folderData?.isPinned, "is_pinned") ?? false
    };
}


// User updates a project folder
export async function patchProjectFolderById(userId, folderId, updates) {
    const parsedUserId = parseUserId(userId);
    const parsedFolderId = parseInteger(folderId, "Folder Id");

    if (!parsedFolderId || parsedFolderId < 1) {
        throw new AppError("Project folder id is required", 400);
    }

    // Checking validity of "isPinned" & "visibility" values
    updates.isPinned = parseBoolean(updates.isPinned, "isPinned");
    
    const allowedVisibility = ["public", "shared", "private"];
    if (updates.visibility !== undefined && !allowedVisibility.includes(updates.visibility))
        throw new AppError("Invalid 'visibility' value", 400);

    const updatedFolders = await updateProjectFolder(parsedUserId, parsedFolderId, updates);
    
    if (updatedFolders === 0)
        throw new AppError("Project folder not found", 404);
}


// User deletes a project folder
export async function deleteProjectFolderById(userId, folderId) {
    // Validate user & project folder id
    const parsedUserId = parseUserId(userId);
    const parsedFolderId = parseInteger(folderId, "Folder Id");

    if (!parsedFolderId || parsedFolderId < 1) {
        throw new AppError("Project folder id is required", 400);
    }

    const deletedFolders = await deleteProjectFolder(parsedUserId, parsedFolderId);

    if (deletedFolders === 0)
        throw new AppError("Project folder not found", 404);
}