import { describe, it, expect } from "vitest";
import { calculatePopularityScores } from "../../../src/algorithms/popularityScoring.js";

describe("calculatePopularityScores", () => {

	// ---------- POPULARITY SCORES CALCULATION FUNCTION  ----------

	it("Returns the popularity scores of 2 papers", () => {
		const papers = [
			{
				paper_id: 1,
				view_count: 10,
				save_count: 5,
				recommendation_click_count: 2,
				citation_score: 20,
				recency_score: 0.5
			},
			{
				paper_id: 2,
				view_count: 1,
				save_count: 0,
				recommendation_click_count: 0,
				citation_score: 2,
				recency_score: 0.1
			}
		];

		const results = calculatePopularityScores(papers);

		//(Normalized scores):
		// 0.30 * saveScore + 0.20 * viewScore + 0.15 * clickScore +
		// 0.25 * citationScore + 0.10 * recencyScore
		expect(results).toHaveLength(2);
		expect(results[0].popularityScore).toBe(1);
		expect(results[0].popularityScore).toBeGreaterThan(results[1].popularityScore);
	});

	it("Treats missing numeric values as 0", () => {
        const result = calculatePopularityScores([
            { paper_id: 1 },
            { paper_id: 2, view_count: 10 }
        ]);

        expect(result).toHaveLength(2);

		// paper 1 has a popularity score of 0, since it has no interaction data
        expect(result[0].popularityScore).toBe(0);
		expect(result[1].popularityScore).toBeGreaterThanOrEqual(0);
    });

	it("Returns an empty array for an empty paper list", () => {
		const result = calculatePopularityScores([]);

		expect(result).toEqual([]);
});
});