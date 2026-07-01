import { describe, it, expect } from "vitest";
import { 
	calculateContentScore,
	generateContentBasedRecommendations 
} from "./../../../src/algorithms/contentBasedRecommendations.js";

describe("contentBasedRecommendations", () => {
	// Using a test user profile and paper feactures that match highly
	// with arbitrary topic, field, subfield, domain, author, keyword for simplicity
	const userProfile = { 
		topic_preferences: { T1: 0.98 },
		field_preferences: { F1: 0.85 },
		subfield_preferences: { SF1: 0.91 },
		domain_preferences: { D1: 0.96 },
		author_preferences: { A1: 0.87 },
		keyword_preferences: { K1: 0.84 }
	};

	const paperFeatures = {
		paper_id: 1,
		topic_vector: { T1: 0.95 },
		field_vector: { F1: 0.88 },
		subfield_vector: { SF1: 0.92 },
		domain_vector: { D1: 0.94 },
		author_vector: { A1: 0.93 },
		keyword_vector: { K1: 0.86 } 
	}

	// ---------- CONTENT SCORE CALCULATION FUNCTION  ----------

	it("Returns score close to 1 for matching user profile and paper vectors", () => {
		const score = calculateContentScore(userProfile, paperFeatures);

		expect(score).toBeCloseTo(1);
	});

	// ---------- CONTENT RECOMMENDATION FUNCTION ----------

	it("Return content recommendation with content score close to 1", () => {
		const result = generateContentBasedRecommendations(userProfile, [paperFeatures], new Set([2]));

		expect(result).toHaveLength(1);
		expect(result[0].contentScore).toBeCloseTo(1);
	});

	it("Return no content recommendations as paper belongs in the excluded set", () => {
		const result = generateContentBasedRecommendations(userProfile, [paperFeatures], new Set([1]));

		expect(result).toHaveLength(0);
	});

	it("Returns an empty array when there are no candidate papers", () => {
		const userProfile = {
			topic_preferences: {},
			field_preferences: {},
			subfield_preferences: {},
			domain_preferences: {},
			author_preferences: {},
			keyword_preferences: {}
		};

		const result = generateContentBasedRecommendations(userProfile, []);

		expect(result).toEqual([]);
});
});