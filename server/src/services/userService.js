import { fetchUserById } from "./../repositories/userRepository.js";
import { fetchUserSearchHistory } from "./../repositories/userHistoryRepository.js";
import { parseIntegerFilter } from "../utils/parseFilters.js";
import { AppError } from "./../utils/AppError.js";

// User accesses their profile page
export async function getUserMe(id) {

    // Validate user id
    if (!id || typeof id !== "number") {
        throw new AppError("Missing/Invalid user id", 400);
    }

    const userProfile = await fetchUserById(id);

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
export async function getUserSearchHistory(id, filters) {

    // Validate user id
    if (!id || typeof id !== "number")
        throw new AppError("Missing/Invalid user id", 400);

    // Validate pagination filters
    const pagination = validatePagination(filters);

    const searchHistory = await fetchUserSearchHistory(id, pagination);

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

    const page = parseIntegerFilter(paginationFilters.page, "page") ?? 1;
    const limit = parseIntegerFilter(paginationFilters.limit, "limit") ?? 25;

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

// User fetches their folders
export async function getUserFolders(id) {}