import { cosineSimilarity } from "../utils/vectorUtils.js";
import { fetchUserProfilePreferences } from "../repositories/recommendationProfileRepository.js";

// User-user similarity, we compute all vector similaries (topics, fields, subfields, etc.)
// and add them through a linear combination that assigns different weight to each similarity
export async function userToUserSimilarity(userAId, userBId) {
	const userAPref = await fetchUserProfilePreferences(userAId);
	const userBPref = await fetchUserProfilePreferences(userBId);

	if (!userAPref || !userBPref) {
		return 0;
	}

	const topicSimilarity = cosineSimilarity(userAPref.topic_preferences, userBPref.topic_preferences);
	const domainSimilarity = cosineSimilarity(userAPref.domain_preferences, userBPref.domain_preferences);
	const fieldSimilarity = cosineSimilarity(userAPref.field_preferences, userBPref.field_preferences);
	const subfieldSimilarity = cosineSimilarity(userAPref.subfield_preferences, userBPref.subfield_preferences);
	const authorSimilarity = cosineSimilarity(userAPref.author_preferences, userBPref.author_preferences);
	const keywordSimilarity = cosineSimilarity(userAPref.keyword_preferences, userBPref.keyword_preferences);

	const finalUserSimilarity = 
		0.35 * topicSimilarity + 0.25 * subfieldSimilarity + 0.15 * fieldSimilarity +
		0.05 * domainSimilarity + 0.10 * authorSimilarity + 0.10 * keywordSimilarity;

	return finalUserSimilarity;
}