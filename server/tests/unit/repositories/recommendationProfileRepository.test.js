import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
	default: {
		query: vi.fn(),
		connect: vi.fn()
	}
}));

import pool from "../../../src/config/db.js";
import {
	upsertUserProfilePreferences,
	fetchUserProfilePreferences } from "../../../src/repositories/recommendationProfileRepository.js";

// Providing some representative tests of some functions, and not every single success/failure case
		
describe("upsertUserProfilePreferences", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Maps all profile preference fields to the correct query parameters", async () => {
		// A mock of the updated user preferences
		const profile = {
				topicPreferences: { T1: 0.7, T2: 0.3 },
				domainPreferences: { D1: 1 },
				fieldPreferences: { F1: 1 },
				subfieldPreferences: { SF1: 0.8, SF2: 0.2 },
				authorPreferences: { A1: 0.6, A2: 0.4 },
				keywordPreferences: {
					"machine learning": 0.7,
					"neural networks": 0.3
				}
			};

			const storedProfile = { user_id: 42, topic_preferences: profile.topicPreferences };

			pool.query.mockResolvedValue({ rows: [storedProfile] });

			const result = await upsertUserProfilePreferences(42, profile);

			const [query, params] = pool.query.mock.calls[0];

			expect(query).toContain("INSERT INTO user_profile_preferences (");
			expect(query).toContain("user_id, topic_preferences, domain_preferences, field_preferences, subfield_preferences,");
			expect(query).toContain("author_preferences, keyword_preferences, updated_at");
			expect(query).toContain(")");
			expect(query).toContain("VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)");
			expect(query).toContain("ON CONFLICT (user_id) DO UPDATE SET");
			expect(query).toContain("topic_preferences = EXCLUDED.topic_preferences,");
			expect(query).toContain("domain_preferences = EXCLUDED.domain_preferences,");
			expect(query).toContain("field_preferences = EXCLUDED.field_preferences,");
			expect(query).toContain("subfield_preferences = EXCLUDED.subfield_preferences,");
			expect(query).toContain("author_preferences = EXCLUDED.author_preferences,");
			expect(query).toContain("keyword_preferences = EXCLUDED.keyword_preferences,");
			expect(query).toContain("updated_at = CURRENT_TIMESTAMP");
			expect(query).toContain("RETURNING *;");

			expect(params).toEqual([
				42, profile.topicPreferences, profile.domainPreferences, profile.fieldPreferences,
				profile.subfieldPreferences, profile.authorPreferences, profile.keywordPreferences
			]);
			expect(result).toEqual(storedProfile);
	});

	it("Uses empty objects for missing preference categories", async () => {
		const profile = { topicPreferences: { T1: 1 } };

		pool.query.mockResolvedValue({ rows: [{ user_id: 42 }] });

		await upsertUserProfilePreferences(42, profile);

		const [_, params] = pool.query.mock.calls[0];

		// Verified query in the previous test, the purpose here is to validate empty object preferences
		expect(params).toEqual([ 42, { T1: 1 }, {}, {}, {}, {}, {}]);
	});
});

describe("fetchUserProfilePreferences", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns null when the user profile does not exist", async () => {
		pool.query.mockResolvedValue({ rows: [] });

		const result = await fetchUserProfilePreferences(42);

		expect(result).toBeNull();
	});
});