import { describe, it, expect } from "vitest";
import { 
	calculateHybridScore,
    getDominantReason,
	calculateFinalRecommendationScores
} from "../../../src/algorithms/hybridRecommendationScoring.js";

describe("hybridRecommendationScoring", () => {

	// ---------- HYBRID SCORE CALCULATION FUNCTION  ----------

	it("Calculates weighted hybrid score", () => {
		// Setting high individual scores for simplicity
		const score = calculateHybridScore({
			contentScore: 1,
			collaborativeScore: 1,
			topicScore: 1,
			popularityScore: 1,
			recencyScore: 1,
		});

		expect(score).toBeCloseTo(1);
	});

	// ---------- TESTING IF THE MOST DOMINANT SCORE -> RECOMMENDATION REASON ----------

	it("Detects dominant reason", () => {
		// Most dominant score -> content score -> "because_of_your_interests"
		const reason = getDominantReason({
			contentScore: 0.8,
			collaborativeScore: 0.2,
			topicScore: 0.1,
			popularityScore: 0.3,
			recencyScore: 0.1
		});

		expect(reason).toBe("because_of_your_interests");
	});

	// ---------- HYBRID RECOMMENDATION FUNCTION ----------	

	it("Calculates hybrid recommendation score", () => {
		const result = calculateFinalRecommendationScores(
			[{ paperId: 1, contentScore: 0.8 }],
            [{ paperId: 1, collaborativeScore: 0.6 }],
            [{ paperId: 2, topicScore: 0.9 }],
            [{ paperId: 3, popularityScore: 0.7 }],
            [{ paper_id: 1, recency_score: 0.5 }]
		);

		expect(result.map(r => r.paperId)).toContain(1);
		expect(result.map(r => r.paperId)).toContain(2);
		expect(result.map(r => r.paperId)).toContain(3);

		// Validating 1/3 of paper scores
		//0.45 * Number(scores.contentScore ?? 0) + 0.25 * Number(scores.collaborativeScore ?? 0) +
		//0.15 * Number(scores.topicScore ?? 0) + 0.10 * Number(scores.popularityScore ?? 0) +
		//0.05 * Number(scores.recencyScore ?? 0)
		const paperOne = result.find(r => r.paperId === 1);
		
		expect(paperOne.contentScore).toBe(0.8);
		expect(paperOne.collaborativeScore).toBe(0.6);
		expect(paperOne.topicScore).toBe(0.0);
		expect(paperOne.popularityScore).toBe(0.0);
		expect(paperOne.recencyScore).toBe(0.5);

		// 0.45 * contentScore + 0.25 * collaborativeScore + 0.15 * topicScore + 
		// 0.10 * popularityScore + 0.05 * recencyScore
		expect(paperOne.finalScore).toBe(0.535);
	});

	it("Returns an empty array when no recommendation sources are provided", () => {
		const result = calculateFinalRecommendationScores();

		expect(result).toEqual([]);
	});
});


