import {
	fetchUserProfilePreferences,
	fetchAllUserProfilePreferences
} from "./../repositories/recommendationProfileRepository.js";
import { replaceUserSimilarityCache } from "./../repositories/recommendationSimilarityRepository.js";
import { userToUserSimilarity } from "./../algorithms/userSimilarity.js";
import { parseUserId } from "./../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";


export async function rebuildUserSimilarityCache(userId) {
	const parsedUserId = parseUserId(userId);

	// Fetch current user's preferences
	const userProfile = await fetchUserProfilePreferences(parsedUserId);

	if (!userProfile)
		throw new AppError("User profile preferences not found", 404);

	// Fetch all user preferences
	const allProfiles = await fetchAllUserProfilePreferences();

	// From all user profiles, 
	// 1) we exclude the current user's profile
	// 2) store similar users and their corresponding similarity scores in an array of objects
	// 3) discard negative similarity records
	// 4) sort them in descending order of similarity scores
	// 5) and keep the 1st 50 records
	const similarities = allProfiles
		.filter(profile => Number(profile.user_id) !== parsedUserId)
		.map(profile => ({
			similarUserId: Number(profile.user_id),
			similarityScore: userToUserSimilarity(userProfile, profile)
		}))
		.filter(sim => sim.similarityScore > 0)
		.sort((a,b) => b.similarityScore - a.similarityScore)
		.slice(0,50);

	// replace user similarity cache for the top 50 similar users
	await replaceUserSimilarityCache(parsedUserId, similarities);

	return similarities;
}



