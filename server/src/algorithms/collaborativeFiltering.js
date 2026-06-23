import { minmaxNormalizeArray } from "./../utils/vectorUtils.js";


export function generateCollaborativeRecommendations(similarUsers, similarUserInteractions, excludedPaperIds = new Set()) {
	const scoreMap = new Map();

	const similarityMap = new Map(
		similarUsers.map(user => [Number(user.similar_user_id), Number(user.similarity_score)])
	);

	// For each paper interaction of a similar user
	for (const interaction of similarUserInteractions) {
		const similarUserId = Number(interaction.user_id);
		const paperId = Number(interaction.paper_id);

		if (excludedPaperIds.has(paperId))
			continue;

		// we calculate its individual contribution to the collaborative score
		const similarityScore = similarityMap.get(similarUserId) ?? 0;
		const interestScore = Number(interaction.interest_score ?? 0);
		
		// Using log to prevent users with extreme interest scores from dominating the rest of the users
		const contribution = similarityScore * Math.log1p(interestScore);

		// and sum up all collaborative scores of each paper
		scoreMap.set(paperId, (scoreMap.get(paperId) ?? 0) + contribution);
	}

	const scoreEntries = [...scoreMap.entries()];
	const rawRecommendations = scoreEntries.map(([paperId, score]) => ({
		paperId,
		rawCollaborativeScore: score
	}));

	// Normalize collaborative scores to the [0,1] range
	const normalizedScores = minmaxNormalizeArray(rawRecommendations.map(rec => rec.rawCollaborativeScore));

	// Also filtering out negative collaborative scores, 
	// and sort recommendations in descending order of those scores.
	return rawRecommendations
		.map((rec, index) => ({
			paperId: rec.paperId,
			collaborativeScore: normalizedScores[index],
		}))
		.filter(rec => rec.collaborativeScore > 0)
		.sort((a,b) => b.collaborativeScore - a.collaborativeScore);
}