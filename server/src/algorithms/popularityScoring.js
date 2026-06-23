import { minmaxNormalizeArray } from "./../utils/vectorUtils.js";

export function calculatePopularityScores(papers) {
	// The first 3 come from paper_metrics
	const viewScores = minmaxNormalizeArray(papers.map(paper => paper.view_count ?? 0));
	const saveScores = minmaxNormalizeArray(papers.map(paper => paper.save_count ?? 0));
	const clickScores = minmaxNormalizeArray(papers.map(paper => paper.recommendation_click_count ?? 0));

	// The last 2 come from paper_recommendation_features
	const citationScores = minmaxNormalizeArray(papers.map(paper => paper.citation_score ?? 0));
	const recencyScores = minmaxNormalizeArray(papers.map(paper => paper.recency_score ?? 0));

	// The popularity score is stored in the corresponding field of paper_metrics
	// and at the time of user cache recomputation, it's assigned to the corresponding popularity_score
	// field of the current user-paper pair
	return papers.map((paper, index) => ({
		paperId: paper.paper_id,
		popularityScore: 0.30 * saveScores[index] + 0.20 * viewScores[index] + 0.15 * clickScores[index] +
						 0.25 * citationScores[index] + 0.10 * recencyScores[index]
	}));
}