import { cosineSimilarity } from "../utils/vectorUtils.js";
import { fetchUserProfilePreferences } from "../repositories/recommendationProfileRepository.js";

// User-user similarity, we compute all vector similaries (topics, fields, subfields, etc.)
// and add them through a linear combination that assigns different weight to each similarity
export async function userToUserSimilarity(userAProfile, userBProfile) {
	if (!userAProfile || !userBProfile) {
		return 0;
	}

	const topicSimilarity = cosineSimilarity(userAProfile.topic_preferences, userBProfile.topic_preferences);
	const domainSimilarity = cosineSimilarity(userAProfile.domain_preferences, userBProfile.domain_preferences);
	const fieldSimilarity = cosineSimilarity(userAProfile.field_preferences, userBProfile.field_preferences);
	const subfieldSimilarity = cosineSimilarity(userAProfile.subfield_preferences, userBProfile.subfield_preferences);
	const authorSimilarity = cosineSimilarity(userAProfile.author_preferences, userBProfile.author_preferences);
	const keywordSimilarity = cosineSimilarity(userAProfile.keyword_preferences, userBProfile.keyword_preferences);

	const finalUserSimilarity = 
		0.35 * topicSimilarity + 0.25 * subfieldSimilarity + 0.15 * fieldSimilarity +
		0.05 * domainSimilarity + 0.10 * authorSimilarity + 0.10 * keywordSimilarity;

	return finalUserSimilarity;
}