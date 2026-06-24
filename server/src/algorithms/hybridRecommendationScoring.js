import { minmaxNormalizeArray } from "./../utils/vectorUtils.js";

// Calculate the final hybrid recommendation score for a single user-paper pair
export function calculateHybridScore(scores) {
	return (
		0.45 * Number(scores.contentScore ?? 0) + 0.25 * Number(scores.collaborativeScore ?? 0) +
		0.15 * Number(scores.topicScore ?? 0) + 0.10 * Number(scores.popularityScore ?? 0) +
		0.05 * Number(scores.recencyScore ?? 0)
	);
}


export function getDominantReason(rec) {
	const scores = [
		["because_of_your_interests", rec.contentScore ?? 0],
		["users_like_you_read", rec.collaborativeScore ?? 0],
		["popular_in_your_topics", rec.topicScore ?? 0],
		["popular_papers", rec.popularityScore ?? 0],
		["recent_relevant_papers", rec.recencyScore ?? 0]
	];

	// Sorting recommendation type-score pairs in descending order for score
	// and extracting the first pair that represents the dominary recommendation reason
	const [reason, score] = scores.sort((a,b) => b[1] - a[1])[0];

	return score > 0 ? reason : "general_recommendation";
}


export function calculateFinalRecommendationScores(
	contentRecommendations = [],
	collaborativeRecommendations = [],
	topicScores = [],
	popularityScores = [],
	paperFeatures = []
) {

	const recommendationMap = new Map();

	// Closure function that can access recommendation Map from outside context
	function ensurePaper(paperId) {
		if (!recommendationMap.has(paperId)) {
			recommendationMap.set(paperId, {
				paperId: paperId,
				contentScore: 0,
				collaborativeScore: 0,
				topicScore: 0,
				popularityScore: 0,
				recencyScore: 0,
				reason: "hybrid"
			});
		}

		return recommendationMap.get(paperId);
	}

	// Building the final paper recommendation for a single user-paper pair
	// by aggregating the scores of content-based, collaborative, topic recommendations, 
	// popularity & recency scores in a single object corresponding to
	// the user_recommendation_cache tuple, and then calculating the final recommendation score

	for (const rec of contentRecommendations) {
		const target = ensurePaper(rec.paper_id);
		target.contentScore = rec.contentScore;
	}

	for (const rec of collaborativeRecommendations) {
		const target = ensurePaper(rec.paper_id);
		target.collaborativeScore = rec.collaborativeScore;
	}

	for (const rec of topicScores) {
		const target = ensurePaper(rec.paper_id);
		target.topicScore = rec.topicScore;
	}

	for (const rec of popularityScores) {
		const target = ensurePaper(rec.paper_id);
		target.popularityScore = rec.popularityScore;
	}

	for (const paper of paperFeatures) {
        const target = ensurePaper(paper.paper_id);
        target.recencyScore = Number(paper.recency_score ?? 0);
    }

	const cacheEntries = [...recommendationMap.values()];

	// Filtering out negative final scores, and sorting recommendation cache tuples
	// in decreasing order of the final score
	return cacheEntries.map(rec => ({
		...rec,
		finalScore: calculateHybridScore(rec),
		reason: getDominantReason(rec)
	}))
	.filter(rec => rec.finalScore > 0)
	.sort((a,b) => b.finalScore - a.finalScore);
}
