import { minmaxNormalizeArray } from "./../utils/vectorUtils.js";


export function generateCollaborativeRecommendations(similarUserInteractions, excludedPaperIds = new Set()) {
	const scoreMap = new Map();

	// For each paper interaction of a similar user
	for (const interaction of similarUserInteractions) {
		const paperId = Number(interaction.paper_id);

		if (excludedPaperIds.has(paperId))
			continue;

		const similarityScore = Number(interaction.similarity_score ?? 0);

		const viewCount = Math.max(Number(interaction.view_count ?? 0), 0);
		const folderCount = Math.max(Number(interaction.saved_folder_count ?? 0), 0);
		
		const viewWeight = Math.log1p(viewCount);
		const saveWeight = (folderCount > 0) ? 5 + 2 * Math.log1p(folderCount) : 0;

		const interactionWeight = viewWeight + saveWeight;
		
		// Using log to prevent users with extreme interest scores from dominating the rest of the users
		const contribution = similarityScore * Math.log1p(interactionWeight);

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