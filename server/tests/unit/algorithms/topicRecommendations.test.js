import { describe, it, expect } from "vitest";
import { 
	calculatePaperTopicScores, 
	generatePaperTopicScores,
	generateTopicRecommendations
} from "../../../src/algorithms/topicRecommendations.js";

describe("topicRecommendations", () => {
	const userProfile = {
		topic_preferences: { T1: 0.93 },
		field_preferences: { F1: 0.89 },
		subfield_preferences: { SF1: 0.91 }
	};


	// ---------- TOPIC SCORES CALCULATION FUNCTION  ----------

	it("Calculates high topic score for matching paper", () => {
		const paperFeatures = {
			topic_vector: { T1: 0.92 },
			field_vector: { F1: 0.87 },
			subfield_vector: { SF1: 0.89 }
		};

		const score = calculatePaperTopicScores(userProfile, paperFeatures);

		expect(score).toBeCloseTo(1);
	});

	it("Calculates topic scores for multiple papers", () => {
		const paperFeatures = [
			{
				paper_id: 1,
				topic_vector: { T1: 0.88 },
				field_vector: { F1: 0.85 },
				subfield_vector: { SF2: 0.92 }
			},
			{
				paper_id: 2,
				topic_vector: { T2: 0.88 },
				field_vector: { F2: 0.98 },
				subfield_vector: { SF2: 0.92 }
			}
		];

		const result = generatePaperTopicScores(userProfile, paperFeatures);

		// Excluding 0 topic score for paper 2
		expect(result).toHaveLength(1);
		expect(result[0].paperId).toBe(1);
	});

	it("Returns an empty array when there are no candidate papers", () => {
		const profile = {
			topic_preferences: {},
			field_preferences: {},
			subfield_preferences: {}
		};

		const result = generatePaperTopicScores(profile, []);

		expect(result).toEqual([]);
	});


	// ---------- USER TOPIC RECOMMENDATION FUNCTION  ----------

	it("Generates topic recommendations for user-preferred topics", () => {
        const topics = [
            {
                openalex_id: "T1",
                topic_display_name: "Machine Learning",
                works_count: 100,
                cited_by_count: 500
            },
            {
                openalex_id: "T2",
                topic_display_name: "Astrophysics",
                works_count: 1000,
                cited_by_count: 5000
            }
        ];

        const result = generateTopicRecommendations(userProfile, topics, 10);

        expect(result).toHaveLength(1);
        expect(result[0].topicId).toBe("T1");
    });
});