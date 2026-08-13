import { fetchUserById, updateUserById, deleteUserById } from "./../repositories/userRepository.js";
import { upsertUserLoginTime } from "./../repositories/userRepository.js";
import { fetchUserSearchHistory, deleteFromSearchHistory } from "./../repositories/userHistoryRepository.js";
import { fetchProjectFoldersById, 
         createProjectFolder, 
         updateProjectFolder,
         deleteProjectFolder,
         fetchPapersFromFolderById,
         insertPapertoFolder,
         fetchPaperInFolder,
         deletePaperFromFolder } from "../repositories/userFolderRepository.js";

import { fetchPaperById } from "./../repositories/paperRepository.js"; 

import { fetchUserTotalViewedPapers,
         fetchUserRecentlyViewedPapers,
         fetchUserTotalSavedPapers,
         fetchUserRecentlySavedPapers,
         fetchUserTotalFolders,
         fetchUserFoldersPreview,
         fetchUserFollowedAuthors,
         fetchUserTopResearchTopics
} from "./../repositories/profileRepository.js";

import { parseUserId, parseInteger, parseString, parseBoolean } from "../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";
import bcryptjs from "bcryptjs";

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
        location: userProfile.location,
        role: userProfile.role,
        bio: userProfile.bio,
        avatarURL: userProfile.avatar_url,

        createdAt: new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }).format(new Date(userProfile.created_at)),

        updatedAt: userProfile.updated_at,

        lastLoginAt: new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }).format(new Date(userProfile.last_login_at))
    };
}

export async function updateUserLoginTime(id) {
    // Validate user id
    const parsedId = parseUserId(id);

    const updatedUser = await upsertUserLoginTime(parsedId);

    if (updatedUser === 0) {
        throw new AppError("User login time was not updated.", 500);
    }
}

// User retrieves their profile info: activity totals, recent activity, top folders, recent followed authors
export async function getMyProfile(id) {
    // Validate user id
    const parsedId = parseUserId(id);

    const [
        totalViewedPapers,
        previewViewedPapers,
        totalSavedPapers, 
        previewSavedPapers,
        totalFolders,
        previewFolders,
        authorsFollowed,
        researchTopics
    ] = await Promise.all([
        fetchUserTotalViewedPapers(parsedId),
        fetchUserRecentlyViewedPapers(parsedId),
        fetchUserTotalSavedPapers(parsedId),
        fetchUserRecentlySavedPapers(parsedId),
        fetchUserTotalFolders(parsedId),
        fetchUserFoldersPreview(parsedId),
        fetchUserFollowedAuthors(parsedId),
        fetchUserTopResearchTopics(parsedId)
    ]);

    // Aggregate profile info DTO (Data-Transfer Object)
    return {
        totalViewedPapers: Number(totalViewedPapers.total_viewed_papers),
        previewViewedPapers: previewViewedPapers.map((paper) => ({
            id: paper.openalex_id,
            internalId: paper.paper_id,
            title: paper.title,
            primaryTopic: paper.primary_topic_display_name,
            authorCount: paper.author_count,
            authorsPreview: paper.authors_preview,
        })),

        totalSavedPapers: Number(totalSavedPapers.total_saved_papers),
        previewSavedPapers: previewSavedPapers.map((paper) => ({
            id: paper.openalex_id,
            internalId: paper.paper_id,
            title: paper.title,
            primaryTopic: paper.primary_topic_display_name,
            authorCount: paper.author_count,
            authorsPreview: paper.authors_preview,
        })),

        totalFolders: Number(totalFolders.total_user_folders),
        previewFolders: previewFolders.map((folder) => ({
            id: folder.id,
            name: folder.name,
            paperCount: folder.paper_count,
            color: folder.color
        })),

        authorsFollowed: authorsFollowed.map((author) => ({
            id: author.author_id,
            authorName: author.author_name,
        })),

        researchTopics
    };

}

// User modifies their profile
export async function patchMyProfile(userId, updates) {
    // Validate user Id
    const parsedUserId = parseUserId(userId);

    // Validate profile update options
    if (!updates || Object.keys(updates).length === 0) {
        throw new AppError("No modified fields were provided", 400);
    }

    const parsedUpdates = validateUserProfileInfo(updates);

    if (Object.keys(parsedUpdates).length === 0) {
        throw new AppError("No valid modified fields were provided", 400);
    }

    // Hash the new password and store the password hash in the DB
    if (parsedUpdates.password !== undefined) {
        parsedUpdates.passwordHash = await bcryptjs.hash(parsedUpdates.password, 12);

        delete parsedUpdates.password;
    }

    const updatedUser = await updateUserById(parsedUserId, parsedUpdates);

    if (updatedUser === 0) {
        throw new AppError("User not found", 404);
    }
}

function validateUserProfileInfo(userInfo) {
    const parsedUpdates = {};

    if (userInfo?.firstName !== undefined) {
        parsedUpdates.firstName = parseString(userInfo?.firstName, "firstName");
    }

    if (userInfo?.lastName !== undefined) {
        parsedUpdates.lastName = parseString(userInfo?.lastName, "lastName");
    }

    if (userInfo?.username !== undefined) {
        parsedUpdates.username = parseString(userInfo?.username, "username");
    }

    if (userInfo?.password !== undefined) {
        parsedUpdates.password = parseString(userInfo?.password, "password");
    }

    if (userInfo?.email !== undefined) {
        parsedUpdates.email = parseString(userInfo?.email, "email");
    }

    if (userInfo?.affiliation !== undefined) {
        parsedUpdates.affiliation = parseString(userInfo?.affiliation, "affiliation");
    }

    if (userInfo?.bio !== undefined) {
        parsedUpdates.bio = parseString(userInfo?.bio, "bio");
    }

    if (userInfo?.location !== undefined) {
        parsedUpdates.location = parseString(userInfo?.location, "location");
    }

    if (userInfo?.role !== undefined) {
        parsedUpdates.role = parseString(userInfo?.role, "role");
    }

    if (userInfo?.avatarURL !== undefined) {
        parsedUpdates.avatarURL = parseString(userInfo?.avatarURL, "avatarURL");
    }

    return parsedUpdates;
}

// User deletes their profile info
export async function deleteMyProfile(userId) {
    // Validate user id
    const parsedId = parseUserId(userId);

    const userDeleted = await deleteUserById(parsedId);

    if (userDeleted === 0) {
        throw new AppError("User not found", 404);
    }
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

    // Checking if any modified parameter exists
    if (!updates || Object.keys(updates).length === 0) {
        throw new AppError("No modified fields were provided", 400);
    }
    // Checking validity of "isPinned" & "visibility" values
    parseBoolean(updates.isPinned, "isPinned");
    
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


// User accesses the papers of a project folder
export async function getPapersFromFolderById(userId, folderId) {
    // Validate user & project folder id
    const parsedUserId = parseUserId(userId);
    const parsedFolderId = parseInteger(folderId, "Folder Id");

    if (!parsedFolderId || parsedFolderId < 1) {
        throw new AppError("Project folder id is required", 400);
    }

    const papers = await fetchPapersFromFolderById(parsedUserId, parsedFolderId);

    // folder papers appear as "paper cards"
    // and hence, use the same DTO as the "paper cards" in the search result
    return papers.map((paper) => ({
        id: paper.openalex_id,
        internalId: paper.id,
        title: paper.title,
        displayName: paper.display_name,
        abstract: paper.abstract,
        publicationYear: paper.publication_year,
        citedByCount: paper.cited_by_count,
        fwci: Number(paper.fwci),
        primarySource: paper.primary_source_display_name,
        primaryTopic: paper.primary_topic_display_name,
        isOpenAccess: paper.is_open_access,
        openAccessStatus: paper.open_access_status,
        authorCount: Number(paper.author_count),
        authorsPreview: paper.authors_preview,
        folderId: paper.folder_id,
        addedAt: paper.added_at,
    }));
}


// User adds paper to a project folder
export async function addPapertoFolderById(userId, folderId, paperId) {
    // Validate user & project folder id
    const parsedUserId = parseUserId(userId);
    const parsedFolderId = parseInteger(folderId, "Folder Id");

    if (!parsedFolderId || parsedFolderId < 1) {
        throw new AppError("Project folder id is required", 400);
    }

    // Validate paper id
    const parsedPaperId = parseString(paperId, "paper id");

    // Validate paper id format: "W" followed by digits
    if (!/^W\d+$/.test(parsedPaperId))
        throw new AppError("Invalid paper id", 400);

    // Validate paper existence
    const paper = await fetchPaperById(parsedPaperId);
    if (!paper) 
        throw new AppError("Paper not found", 404);

    // Validate duplicate
    const existingPaper = await fetchPaperInFolder(parsedFolderId, paper.id);
    if (existingPaper)
        throw new AppError("Paper already exists in project folder", 409);

    const addedPapers = await insertPapertoFolder(parsedUserId, parsedFolderId, paper.id);

    if (addedPapers === 0)
        throw new AppError("Paper was not inserted to project folder", 500);

    return paper.id;
}


// User deletes paper from project folder
export async function deletePaperFromFolderById(userId, folderId, paperId) {
    // Validate user & project folder id
    const parsedUserId = parseUserId(userId);
    const parsedFolderId = parseInteger(folderId, "Folder Id");

    if (!parsedFolderId || parsedFolderId < 1) {
        throw new AppError("Project folder id is required", 400);
    }

    // Validate paper id
    const parsedPaperId = parseString(paperId, "paper id");

    // Validate paper id format: "W" followed by digits
    if (!parsedPaperId || !/^W\d+$/.test(parsedPaperId))
        throw new AppError("Invalid paper id", 400);

    // Validate paper existence
    const paper = await fetchPaperById(parsedPaperId);
    if (!paper) 
        throw new AppError("Paper not found", 404);

    const deletedPapers = await deletePaperFromFolder(parsedUserId, parsedFolderId, paper.id);

    if (deletedPapers === 0)
        throw new AppError("Paper wasn't stored in project folder", 404);

    return paper.id;
}
