import { fetchUserById } from "./../repositories/userRepository.js";
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
    const userProfileDTO = {
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

    return userProfileDTO;
}

// User fetches their search history
export async function getUserHistory(id) {}

// User fetches their folders
export async function getUserFolders(id) {}