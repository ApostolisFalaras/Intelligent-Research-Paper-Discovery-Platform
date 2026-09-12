import { describe, it, expect } from "vitest";
import { generateCollaborativeRecommendations }
    from "../../../src/algorithms/collaborativeFiltering.js";

describe("generateCollaborativeRecommendations", () => {

    it("Aggregates collaborative contributions for the same paper and sorts descending", () => {
        const interactions = [
            { paper_id: 1, similarity_score: 0.9, view_count: 8, saved_folder_count: 2 },
            { paper_id: 1, similarity_score: 0.7, view_count: 4, saved_folder_count: 1 },
            { paper_id: 2, similarity_score: 0.8, view_count: 2, saved_folder_count: 0 },
            { paper_id: 3, similarity_score: 0.3, view_count: 1, saved_folder_count: 0 }
        ];

        const result = generateCollaborativeRecommendations(interactions);

        expect(result[0].paperId).toBe(1);
        expect(result[0].collaborativeScore).toBe(1);

        expect(result[0].collaborativeScore).toBeGreaterThan(result[1].collaborativeScore);
    });

    it("Gives saved papers more interaction weight than equally viewed unsaved papers", () => {
        const interactions = [
            { paper_id: 1, similarity_score: 0.8, view_count: 3, saved_folder_count: 2},
            { paper_id: 2, similarity_score: 0.8, view_count: 3, saved_folder_count: 0 },
            {
                // Third paper prevents two-value min-max normalization
                // from simply becoming [1, 0].
                paper_id: 3, similarity_score: 0.8, view_count: 1, saved_folder_count: 0
            }
        ];

        const result = generateCollaborativeRecommendations(interactions);

        const savedPaper = result.find(rec => rec.paperId === 1);
        const viewedOnlyPaper = result.find(rec => rec.paperId === 2);

        expect(savedPaper.collaborativeScore)
            .toBeGreaterThan(viewedOnlyPaper.collaborativeScore);
    });

    it("Aggregates contributions from multiple similar users for the same paper", () => {
		const interactions = [
			{ user_id: 10, paper_id: 1, similarity_score: 0.6, view_count: 3, saved_folder_count: 0 },
			{ user_id: 11, paper_id: 1, similarity_score: 0.7, view_count: 2, saved_folder_count: 1 },
			{ user_id: 12, paper_id: 2, similarity_score: 0.9, view_count: 1, saved_folder_count: 0 },

			// Lower-scoring third paper establishes the normalization minimum
			{ user_id: 13, paper_id: 3, similarity_score: 0.1, view_count: 1, saved_folder_count: 0 }
		];

		const result = generateCollaborativeRecommendations(interactions);

		const paper1 = result.find(rec => rec.paperId === 1);
		const paper2 = result.find(rec => rec.paperId === 2);

		expect(paper1).toBeDefined();
		expect(paper2).toBeDefined();

		// Contributions from users 10 and 11 were aggregated for paper 1
		expect(paper1.collaborativeScore)
			.toBeGreaterThan(paper2.collaborativeScore);

		// Lowest-scoring candidate is normalized to 0 and filtered
		expect(result.some(rec => rec.paperId === 3)).toBe(false);
});

    it("Excludes papers already interacted with by the target user", () => {
        const interactions = [
            { paper_id: 1, similarity_score: 0.9, view_count: 10, saved_folder_count: 2 },
            { paper_id: 2, similarity_score: 0.8, view_count: 5, saved_folder_count: 1 },
            { paper_id: 3, similarity_score: 0.4, view_count: 1, saved_folder_count: 0 }
        ];

        const result = generateCollaborativeRecommendations(interactions, new Set([1]));

        expect(result.some(rec => rec.paperId === 1)).toBe(false);
    });

    it("Treats missing interaction counts as zero", () => {
        const interactions = [
            { paper_id: 1, similarity_score: 0.9 },
            { paper_id: 2, similarity_score: 0.8, view_count: 4, saved_folder_count: 1 }
        ];

        const result = generateCollaborativeRecommendations(interactions);

        expect(result.some(rec => rec.paperId === 1)).toBe(false);
        expect(result.some(rec => rec.paperId === 2)).toBe(true);
    });

    it("Treats negative view and folder counts as zero", () => {
        const interactions = [
            { paper_id: 1, similarity_score: 0.9, view_count: -10, saved_folder_count: -3 },
            { paper_id: 2, similarity_score: 0.8, view_count: 4, saved_folder_count: 1 }
        ];

        const result = generateCollaborativeRecommendations(interactions);

        expect(result.some(rec => rec.paperId === 1)).toBe(false);
        expect(result.some(rec => rec.paperId === 2)).toBe(true);
    });

    it("Returns normalized collaborative scores in the [0,1] range", () => {
        const interactions = [
            { paper_id: 1, similarity_score: 0.9, view_count: 10, saved_folder_count: 2 },
            { paper_id: 2, similarity_score: 0.6, view_count: 5, saved_folder_count: 1 },
            { paper_id: 3, similarity_score: 0.3, view_count: 2, saved_folder_count: 0 }
        ];

        const result = generateCollaborativeRecommendations(interactions);

        for (const rec of result) {
            expect(rec.collaborativeScore).toBeGreaterThanOrEqual(0);
            expect(rec.collaborativeScore).toBeLessThanOrEqual(1);
        }
    });

    it("Returns an empty array when there are no similar-user interactions", () => {
        expect(generateCollaborativeRecommendations([])).toEqual([]);
    });
});