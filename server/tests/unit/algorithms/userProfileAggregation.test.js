import { describe, it, expect } from "vitest";
import { buildProfilePreferences } from "../../../src/algorithms/userProfileAggregation.js";

describe("userProfileAggregation", () => {

	it("Returns a user's profile preferences from interaction data", () => {
		const interactions = [
			{
                interest_score: 5,
                topic_vector: { T1: 0.95 },
                domain_vector: { D1: 0.99 },
                field_vector: { F1: 0.91 },
                subfield_vector: { S1: 0.85 },
                author_vector: { A1: 0.77 },
                keyword_vector: { K1: 0.81 }
            },
            {
                interest_score: 3,
                topic_vector: { T1: 0.96, T2: 0.80 },
                domain_vector: { D1: 0.99 },
                field_vector: { F1: 0.89 },
                subfield_vector: { S2: 0.90 },
                author_vector: { A2: 0.78 },
                keyword_vector: { K2: 0.82 }
            }
		];

		const result = buildProfilePreferences(interactions);

		// Testing general preference conditions and not exact values
		expect(result.topicPreferences.T1).toBeGreaterThan(result.topicPreferences.T2);
		expect(result.domainPreferences.D1).toBeGreaterThan(0);
        expect(result.authorPreferences.A1).toBeGreaterThan(0);
	});

	
	it("Ignores paper interactions with a negative interest scores", () => {
        const interactions = [
			{
                interest_score: 5,
                topic_vector: { T1: 0.95 },
                domain_vector: { D1: 0.99 },
                field_vector: { F1: 0.91 },
                subfield_vector: { S1: 0.85 },
                author_vector: { A1: 0.77 },
                keyword_vector: { K1: 0.81 }
            },
            {
                interest_score: -5,
                topic_vector: { T1: 1 },
                domain_vector: {},
                field_vector: {},
                subfield_vector: {},
                author_vector: {},
                keyword_vector: {}
            }
        ];

        const result = buildProfilePreferences(interactions);

		// The 2nd interaction is ignored
        expect(Object.keys(result.topicPreferences)).toHaveLength(1);
    });

	it("Returns empty user profile preferences when there are no interactions", () => {
		const result = buildProfilePreferences([]);

		expect(result.topicPreferences).toEqual({});
		expect(result.domainPreferences).toEqual({});
		expect(result.fieldPreferences).toEqual({});
		expect(result.subfieldPreferences).toEqual({});
		expect(result.authorPreferences).toEqual({});
		expect(result.keywordPreferences).toEqual({});
	});
});