import { minMaxNormalization } from "./../utils/vectorUtils.js";


// Calculate global popularity score for a single paper
export function calculateGlobalPopularityScore(paper, ranges) {

    const viewScore = minMaxNormalization(paper.view_count, ranges.min_views, ranges.max_views);
    const saveScore = minMaxNormalization(paper.save_count, ranges.min_saves, ranges.max_saves);
    const clickScore = minMaxNormalization(paper.recommendation_click_count, ranges.min_clicks, ranges.max_clicks);
    const citationScore = minMaxNormalization(paper.citation_score, ranges.min_citations, ranges.max_citations);
    const recencyScore = minMaxNormalization(paper.recency_score, ranges.min_recency, ranges.max_recency);

    return (
        0.30 * saveScore + 0.20 * viewScore + 0.15 * clickScore +
        0.25 * citationScore + 0.10 * recencyScore
    );
}