import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
	default: {
		query: vi.fn(),
		connect: vi.fn()
	}
}));

import pool from "../../../src/config/db.js";
import {
	fetchUserInteractionRows,
	fetchUserInteractionsCount,
	upsertUserProfilePreferences,
	fetchUserProfilePreferences,
	fetchAllUserProfilePreferences,
	deleteUserProfilePreferences
} from "../../../src/repositories/recommendationProfileRepository.js";

// Providing some representative tests of some functions, and not every single success/failure case

describe("fetchUserInteractionRows", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Fetches user interactions with recommendation features and saved folder count", async () => {
		const rows = [
			{
				user_id: 42,
				paper_id: "101",
				view_count: 4,
				is_saved: true,
				saved_folder_count: "2",
				topic_vector: { T1: 0.8, T2: 0.2 },
				domain_vector: { D1: 1 },
				field_vector: { F1: 1 },
				subfield_vector: { SF1: 1 },
				author_vector: { A1: 1 },
				keyword_vector: { K1: 1 },
				citation_score: 0.7,
				recency_score: 0.9
			}
		];

		pool.query.mockResolvedValue({ rows });

		const result = await fetchUserInteractionRows(42);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("JOIN paper_recommendation_features prf");
		expect(query).toContain("LEFT JOIN LATERAL");
		expect(query).toContain("FROM user_folder_papers ufp");
		expect(query).toContain("JOIN user_folders uf");
		expect(query).toContain("COALESCE(folder_data.saved_folder_count, 0) AS saved_folder_count");
		expect(query).toContain("WHERE upi.user_id = $1");
		expect(query).toContain("ORDER BY upi.last_interaction_at DESC");

		expect(params).toEqual([42]);
		expect(result).toEqual(rows);
	});
});


describe("fetchUserInteractionsCount", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns the user's interaction count", async () => {
		pool.query.mockResolvedValue({
			rows: [
				{ num_interactions: "12" }
			]
		});

		const result = await fetchUserInteractionsCount(42);

		expect(pool.query).toHaveBeenCalledWith(
			expect.stringContaining("SELECT COUNT(*) AS num_interactions"),
			[42]
		);

		expect(result).toEqual({ num_interactions: "12" });
	});
});


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


describe("fetchAllUserProfilePreferences", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns all user preference profiles ordered by latest update", async () => {
		const profiles = [
			{ user_id: 42, topic_preferences: { T1: 1 } },
			{ user_id: 43, topic_preferences: { T2: 1 } }
		];

		pool.query.mockResolvedValue({ rows: profiles });

		const result = await fetchAllUserProfilePreferences();

		const [query] = pool.query.mock.calls[0];
		
		expect(query).toContain("FROM user_profile_preferences");
		expect(query).toContain("ORDER BY updated_at DESC");

		expect(result).toEqual(profiles);
	});
});


describe("deleteUserProfilePreferences", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns the number of deleted preference rows", async () => {
		pool.query.mockResolvedValue({ rowCount: 1});

		const result = await deleteUserProfilePreferences(42);

		expect(pool.query).toHaveBeenCalledWith(
			expect.stringContaining("DELETE FROM user_profile_preferences"),
			[42]
		);

		expect(result).toBe(1);
	});
});