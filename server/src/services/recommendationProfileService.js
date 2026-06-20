import { 
	fetchUserInteractionRows, 
	upsertUserProfilePreferences } from "./../repositories/recommendationProfileRepository.js";
import { 
	fetchStaleRecommendations, 
	markUserRecommendationsProcessed } from "../repositories/recommendationRefreshRepository.js";
import { addWeightVector, normalizeVector } from "./../utils/vectorUtils.js";
import { parseUserId, parseInteger } from "./../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";



// Helper function constructing each type of user preferences
function buildProfilePreferences(interactionFeatures) {
	const topicPreferences = {};
	const domainPreferences = {};
	const fieldPreferences = {};
	const subfieldPreferences = {};
	const authorPreferences = {};
	const keywordPreferences = {};

	for (const interaction of interactionFeatures) {
		// Interest score captures the interaction's weight
		const weight = Math.max(Number(interaction.interest_score ?? 0), 0);

		addWeightVector(topicPreferences, interaction.topic_vector, weight);
		addWeightVector(domainPreferences, interaction.domain_vector, weight);
		addWeightVector(fieldPreferences, interaction.field_vector, weight);
		addWeightVector(subfieldPreferences, interaction.subfield_vector, weight);
		addWeightVector(authorPreferences, interaction.author_vector, weight);
		addWeightVector(keywordPreferences, interaction.keyword_vector, weight);
	}

	return {
		topicPreferences: normalizeVector(topicPreferences),
		domainPreferences: normalizeVector(domainPreferences),
		fieldPreferences: normalizeVector(fieldPreferences),
		subfieldPreferences: normalizeVector(subfieldPreferences),
		authorPreferences: normalizeVector(authorPreferences),
		keywordPreferences: normalizeVector(keywordPreferences)
	}
}


// Rebuild a user's profile preferences based on their recorded interactions with papers
export async function rebuildUserProfilePreferences(userId) {
	// Validate user id
	const parsedUserId = parseUserId(userId);

	const rows = await fetchUserInteractionRows(parsedUserId);

	if (rows.length === 0)
		throw new AppError("User has no interactions to build profile preferences", 404);


	const profile = buildProfilePreferences(rows);

	return await upsertUserProfilePreferences(userId, profile);
}


// Finds up to "limit" users whose profile preferences are stale, and rebuilds them
// This is executed by a background worker on a schedule
export async function rebuildStaleUserProfilePreferences(limit = 50) {
	// Validate limit value
	const parsedLimit = parseInteger(limit, "limit") ?? 50;

	if (parsedLimit < 1 || parsedLimit > 500)
		throw new AppError("'limit' must be between 1 and 500", 400);
	

	const staleUsers = await fetchStaleRecommendations(parsedLimit);

	const results = [];

	// We use try-catch to prevent the background job from crashing
	// and to allow the rest of the stale users to be processed, despite the failures of other users
	for (const staleUser of staleUsers) {
		try {
			const profile = await rebuildUserProfilePreferences(staleUser.user_id);

			await markUserRecommendationsProcessed(staleUser.user_id);

			results.push({
				userId: staleUser.user_id,
				status: "success",
				profile
			});
		} catch (error) {
			results.push({
				userId: staleUser.user_id,
				status: "failed",
				message: error.message
			})
		}
	}

	return results;
}