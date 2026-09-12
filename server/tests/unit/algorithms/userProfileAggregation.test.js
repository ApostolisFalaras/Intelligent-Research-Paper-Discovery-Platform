import { describe, it, expect } from "vitest";
import { buildProfilePreferences }
    from "../../../src/algorithms/userProfileAggregation.js";

describe("buildProfilePreferences", () => {
    it("Builds normalized user profile preferences from paper interactions", () => {
        const interactions = [
            {
                view_count: 8,
                saved_folder_count: 2,
                topic_vector: { T1: 0.8, T2: 0.2 },
                domain_vector: { D1: 1 },
                field_vector: { F1: 1 },
                subfield_vector: { S1: 0.7, S2: 0.3 },
                author_vector: { A1: 0.6, A2: 0.4 },
                keyword_vector: { K1: 0.75, K2: 0.25 }
            },
            {
                view_count: 3,
                saved_folder_count: 0,
                topic_vector: { T1: 0.4, T3: 0.6 },
                domain_vector: { D1: 1 },
                field_vector: { F1: 0.5, F2: 0.5 },
                subfield_vector: { S2: 1 },
                author_vector: { A2: 0.5, A3: 0.5 },
                keyword_vector: { K2: 0.4, K3: 0.6 }
            }
        ];

        const result = buildProfilePreferences(interactions);

        expect(result.topicPreferences.T1).toBeGreaterThan(result.topicPreferences.T3);
        expect(result.domainPreferences.D1).toBeCloseTo(1);
        expect(result.authorPreferences.A1).toBeGreaterThan(0);
        expect(result.authorPreferences.A2).toBeGreaterThan(0);
        expect(result.authorPreferences.A3).toBeGreaterThan(0);
    });

    it("Gives saved papers more influence than equally viewed unsaved papers", () => {
        const interactions = [
            {
                view_count: 3,
                saved_folder_count: 2,
                topic_vector: { T1: 1 },
                domain_vector: {},
                field_vector: {},
                subfield_vector: {},
                author_vector: {},
                keyword_vector: {}
            },
            {
                view_count: 3,
                saved_folder_count: 0,
                topic_vector: { T2: 1 },
                domain_vector: {},
                field_vector: {},
                subfield_vector: {},
                author_vector: {},
                keyword_vector: {}
            }
        ];

        const result = buildProfilePreferences(interactions);

        expect(result.topicPreferences.T1).toBeGreaterThan(result.topicPreferences.T2);
    });

    it("Treats negative view and saved-folder counts as zero", () => {
        const interactions = [
            {
                view_count: -10,
                saved_folder_count: -2,
                topic_vector: { T1: 1 },
                domain_vector: {},
                field_vector: {},
                subfield_vector: {},
                author_vector: {},
                keyword_vector: {}
            },
            {
                view_count: 2,
                saved_folder_count: 0,
                topic_vector: { T2: 1 },
                domain_vector: {},
                field_vector: {},
                subfield_vector: {},
                author_vector: {},
                keyword_vector: {}
            }
        ];

        const result = buildProfilePreferences(interactions);

        expect(result.topicPreferences.T1).toBe(0);
        expect(result.topicPreferences.T2).toBe(1);
    });

    it("Treats missing interaction counts as zero", () => {
        const interactions = [
            {
                topic_vector: { T1: 1 },
                domain_vector: {},
                field_vector: {},
                subfield_vector: {},
                author_vector: {},
                keyword_vector: {}
            }
        ];

        const result = buildProfilePreferences(interactions);

        expect(result.topicPreferences).toEqual({});
    });

    it("Normalizes every non-empty preference vector", () => {
        const interactions = [
            {
                view_count: 5,
                saved_folder_count: 1,
                topic_vector: { T1: 0.7, T2: 0.3 },
                domain_vector: { D1: 1 },
                field_vector: { F1: 0.6, F2: 0.4 },
                subfield_vector: { S1: 1 },
                author_vector: { A1: 0.5, A2: 0.5 },
                keyword_vector: { K1: 0.8, K2: 0.2 }
            }
        ];

        const result = buildProfilePreferences(interactions);

        const sum = (vector) =>
            Object.values(vector)
                .reduce((total, value) => total + Number(value), 0);

        expect(sum(result.topicPreferences)).toBeCloseTo(1, 5);
        expect(sum(result.domainPreferences)).toBeCloseTo(1, 5);
        expect(sum(result.fieldPreferences)).toBeCloseTo(1, 5);
        expect(sum(result.subfieldPreferences)).toBeCloseTo(1, 5);
        expect(sum(result.authorPreferences)).toBeCloseTo(1, 5);
        expect(sum(result.keywordPreferences)).toBeCloseTo(1, 5);
    });

    it("Keeps only the configured maximum number of preferences", () => {
        const topicVector = Object.fromEntries(
            Array.from({ length: 60 }, (_, i) => [
                `T${i + 1}`,
                60 - i
            ])
        );

        const domainVector = Object.fromEntries(
            Array.from({ length: 25 }, (_, i) => [
                `D${i + 1}`,
                25 - i
            ])
        );

        const fieldVector = Object.fromEntries(
            Array.from({ length: 40 }, (_, i) => [
                `F${i + 1}`,
                40 - i
            ])
        );

        const interactions = [
            {
                view_count: 5,
                saved_folder_count: 1,
                topic_vector: topicVector,
                domain_vector: domainVector,
                field_vector: fieldVector,
                subfield_vector: {},
                author_vector: {},
                keyword_vector: {}
            }
        ];

        const result = buildProfilePreferences(interactions);

        expect(Object.keys(result.topicPreferences)).toHaveLength(50);
        expect(Object.keys(result.domainPreferences)).toHaveLength(20);
        expect(Object.keys(result.fieldPreferences)).toHaveLength(30);
    });

    it("Returns empty profile preferences when there are no interactions", () => {
        const result = buildProfilePreferences([]);

        expect(result).toEqual({
            topicPreferences: {},
            domainPreferences: {},
            fieldPreferences: {},
            subfieldPreferences: {},
            authorPreferences: {},
            keywordPreferences: {}
        });
    });
});