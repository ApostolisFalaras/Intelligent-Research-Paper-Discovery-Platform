import { minmaxNormalizeArray } from "./../utils/vectorUtils.js";
import { cosineSimilarity } from "./../utils/vectorUtils";

// Calculates a single paper's topic score in terms of a user's preferences
export function calculatePaperTopicScores(userProfile, paperFeatures) {
	const topicScore = cosineSimilarity(userProfile.topic_preferences, paperFeatures.topic_vector);
	const fieldScore = cosineSimilarity(userProfile.field_preferences, paperFeatures.field_vector);
	const subfieldScore = cosineSimilarity(userProfile.subfield_preferences, paperFeatures.subfield_vector);

	return 0.60 * topicScore + 0.30 * fieldScore + 0.10 * subfieldScore;
}

// Calculates the topic score for a set of candidate user-paper pairs
// It filters out negative topic scores,
// and sorts the topic score records in descending order of score
export function generatePaperTopicScores(userProfile, candidatePapers) {
	return candidatePapers
		.map(paper => ({
			paperId: paper.paper_id,
			topicScore: calculatePaperTopicScores(userProfile, paper)
		}))
		.filter(rec => rec.topicScore > 0)
		.sort((a,b) => b.topicScore - a.topicScore);
}


// It's used for general topic recommendations to a user
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



