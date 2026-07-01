import { describe, it, expect } from "vitest";
import { generateCollaborativeRecommendations } from "../../../src/algorithms/collaborativeFiltering.js";

describe("generateCollaborativeRecommendations", () => {

	// ---------- COLLABORATIVE RECOMMENDATION FUNCTION ----------

	it("Aggregates scores for the same paper and sorts descending", () => {
		// Providing only the necessary features from the JOIN of 
		// user_paper_interactions and user_similarity_cache tables
		const interactions = [
			{ paper_id: 1, similarity_score: 0.9, interest_score: 5 },
			{ paper_id: 2, similarity_score: 0.8, interest_score: 4 },
			{ paper_id: 3, similarity_score: 0.2, interest_score: 1 }
		];

		const result = generateCollaborativeRecommendations(interactions);

		// Ensuring the correct ordering of collaborative scores, rather than the actual values
		expect(result[0].paperId).toBe(1);
		expect(result[0].collaborativeScore).toBeGreaterThan(result[1].collaborativeScore);
	});

	// ---------- NO SIMILAR INTERACTIONS ----------

	it("Returns an empty array when there are no similar user interactions", () => {
		const result = generateCollaborativeRecommendations([]);

		expect(result).toEqual([]);
	});

	// ---------- INTERACTIONS WITH EXCLUDED PAPERS ----------

	it("Excludes papers already interacted with", () => {
		const interactions = [
			{ paper_id: 1, similarity_score: 1, interest_score: 10 },
			{ paper_id: 2, similarity_score: 1, interest_score: 5 }
		];

		const result = generateCollaborativeRecommendations(interactions, new Set([1]));

		expect(result).toHaveLength(1);
		expect(result[0].paperId).toBe(2);
	});
});