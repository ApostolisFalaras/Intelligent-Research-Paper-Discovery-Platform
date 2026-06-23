import { minmaxNormalizeArray } from "../utils/vectorUtils";

export function generateTopicRecommendations(userProfile, topicRows = [], limit = 20) {
	const topicPreferences = userProfile.topic_preferences ?? {};

	// For each candidate topic, exclude those that are not included in the user preferences
	// and calculate each topic's popularity score
	const candidates = topicRows
		.filter(topic => topicPreferences[topic.openalex_id] !== undefined)
		.map(topic => ({
			topicId: topic.openalex_id,
			displayName: topic.topic_display_name,
			userPreferenceScore: Number(topicPreferences[topic.openalex_id]),
			popularityRaw: Number(topic.works_count ?? 0) + Number(topic.cited_by_count ?? 0)
		}));

	// Normalize popularities in the [0,1] range
	const normalizedPopularity = minmaxNormalizeArray(candidates.map(topic => topic.popularityRaw));

	// Calculate final topic score based on the user's preference and the normalized popularity
	// Sort topics in descending order of score and keep the first "limit" topics
	return candidates
		.map((topic, index) => ({
			...topic,
			topicScore: 0.80 * topic.userPreferenceScore + 0.20 * normalizedPopularity[index],
		}))
		.sort((a, b) => b.topicScore - a.topicScore)
		.slice(0,limit);
}