import { 
	fetchUserInteractionRows, 
	upsertUserProfilePreferences } from "./../repositories/recommendationProfileRepository.js";
import { 
	fetchStaleRecommendations, 
	markUserRecommendationsProcessed } from "./../repositories/recommendationRefreshRepository.js";
import { buildProfilePreferences } from "./../algorithms/userProfileAggregation.js";
import { parseUserId, parseInteger } from "./../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";


// Rebuild a user's profile preferences based on their recorded interactions with papers
export async function rebuildUserProfilePreferences(userId) {
	// Validate user id
	const parsedUserId = parseUserId(userId);

	const rows = await fetchUserInteractionRows(parsedUserId);

	if (rows.length === 0)
		throw new AppError("User has no interactions to build profile preferences", 404);


	const profile = buildProfilePreferences(rows);

	return await upsertUserProfilePreferences(parsedUserId, profile);
}
