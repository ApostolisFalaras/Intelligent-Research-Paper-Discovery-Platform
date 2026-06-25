import { fetchStaleRecommendations, markUserRecommendationsProcessed } from "./../repositories/recommendationRefreshRepository";
import { rebuildUserRecommendationCache } from "./recommendationCacheService.js";
import { rebuildUserProfilePreferences } from "./recommendationProfileService.js";
import { rebuildUserSimilarityCache } from "./recommendationSimilarityService.js";
import { parseInteger } from "./../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";


// Finds up to "limit" users whose recommendations are stale, and rebuilds them
// This is executed by a background worker on a schedule
export async function rebuildStaleUserRecommendations(limit = 50) {
	// Validate limit value
	const parsedLimit = parseInteger(limit, "limit") ?? 50;

	if (parsedLimit < 1 || parsedLimit > 500)
		throw new AppError("'limit' must be between 1 and 500", 400);

	const staleUsers = await fetchStaleRecommendations(limit);

	const results = [];

	// We use try-catch to prevent the background job from crashing
	// and to allow the rest of the stale users to be processed, despite the failures of other users
	for (const staleUser of staleUsers) {
		const userId = staleUser.user_id;

		try {
			await rebuildUserProfilePreferences(userId);
			await rebuildUserSimilarityCache(userId);
			await rebuildUserRecommendationCache(userId);

			await markUserRecommendationsProcessed(userId);

			results.push({
				userId,
				status: "success"
			});
		} catch (error) {
			results.push({
				userId,
				status: "failed",
				message: error.message
			});
		}
	}

	return results;
}