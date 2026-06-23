import { cosineSimilarity } from "./../utils/vectorUtils.js";

// Calculates content score for a paper recommendation to a user
export function calculateContentScore(userProfile, paperFeatures) {
	const topicScore = cosineSimilarity(userProfile.topic_preferences, paperFeatures.topic_vector);
	const fieldScore = cosineSimilarity(userProfile.field_preferences, paperFeatures.field_vector);
	const subfieldScore = cosineSimilarity(userProfile.subfield_preferences, paperFeatures.subfield_vector);
	const domainScore = cosineSimilarity(userProfile.domain_preferences, paperFeatures.domain_vector);
	const authorScore = cosineSimilarity(userProfile.author_preferences, paperFeatures.author_vector);
	const keywordScore = cosineSimilarity(userProfile.keyword_preferences, paperFeatures.keyword_vector);

	return (
		0.35 * topicScore + 0.20 * subfieldScore + 0.15 * fieldScore + 0.10 * domainScore + 
		0.10 * authorScore + 0.10 * keywordScore
	);
}

// Generate content-based recommendations based on a candidate set of papers
// for a particular user
export function generateContentBasedRecommendations(userProfile, candidatePapers, excludedPaperIds = new Set()) {
	// Filtering out excluded papers, and creating the content-based fields of the recommendation
	const recommendations = 
		candidatePapers
		.filter(paper => !excludedPaperIds.has(Number(paper.paper_id)))
		.map(paper => ({
			paperId: paper.paper_id,
			contentScore: calculateContentScore(userProfile, paper),
			recencyScore: Number(paper.recency_score ?? 0)
		}));
	
	// Filtering out negative content scores and sorting the array is descending order of those scores.
	return recommendations
		.filter(rec => rec.contentScore > 0)
		.sort((a, b) => b.contentScore - a.contentScore);

}