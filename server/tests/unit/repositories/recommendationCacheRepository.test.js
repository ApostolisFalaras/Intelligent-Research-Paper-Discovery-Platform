import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
	default: {
		query: vi.fn(),
		connect: vi.fn()
	}
}));

import pool from "../../../src/config/db.js";
import { 
	replaceUserRecommendationCache,
	fetchUserRecommendationCacheByReason,
	deleteUserRecommendationCache } from "../../../src/repositories/recommendationCacheRepository.js";

describe("replaceUserRecommendationCache", () => {
	let client;

	beforeEach(() => {
		vi.resetAllMocks();

		client = {
			query: vi.fn(),
			release: vi.fn()
		};

		pool.connect.mockResolvedValue(client);
	});

	// ---------- SUCCESSFUL CASE ----------
	
	it("Deletes the old cache and bulk-inserts new recommendations in one transaction", async () => {
		const recommendations = [
			{
				paperId: 101, finalScore: 0.91, contentScore: 0.82, collaborativeScore: 0.30,
				topicScore: 0.74, popularityScore: 0.50, recencyScore: 0.60, reason: "content"
			},
			{
				paperId: 102, finalScore: 0.84, contentScore: 0.40, collaborativeScore: 0.80,
				topicScore: 0.55, popularityScore: 0.35, recencyScore: 0.70, reason: "collaborative"
			}
		];

		client.query.mockResolvedValue({ rows: [], rowCount: 1 });

		await replaceUserRecommendationCache(42, recommendations);

		expect(pool.connect).toHaveBeenCalledTimes(1);

		// Verify all 4 client queries:
		// 1) Begin transaction
		expect(client.query).toHaveBeenCalledTimes(4);
		expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");

		// 2) Delete old user similarity cache entries
		expect(client.query).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("DELETE FROM user_recommendation_cache WHERE user_id = $1"),
			[42]
		);

		// 3) Bulk-insert new user similarity cache entries
		expect(client.query).toHaveBeenNthCalledWith(
			3,
			expect.stringContaining("INSERT INTO user_recommendation_cache"),
			[
				42, 101, 0.91, 0.82, 0.30, 0.74, 0.50, 0.60,"content",
				42, 102, 0.84, 0.40, 0.80, 0.55, 0.35, 0.70, "collaborative"
			]
		);

		// 4) Commit transaction effects
		expect(client.query).toHaveBeenNthCalledWith(4, "COMMIT");
		expect(client.release).toHaveBeenCalledTimes(1);
	});

	it("Deletes the old cache without inserting when recommendations are empty", async () => {
		client.query.mockResolvedValue({ rows: [], rowCount: 1});

		await replaceUserRecommendationCache(42, []);

		expect(pool.connect).toHaveBeenCalledTimes(1);

		expect(client.query).toHaveBeenCalledTimes(3);

		// Verify all 4 client queries:
		// 1) Begin transaction
		expect(client.query).toHaveBeenCalledTimes(3);
		expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");

		// 2) Delete old user similarity cache entries
		expect(client.query).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("DELETE FROM user_recommendation_cache WHERE user_id = $1"),
			[42]
		);

		
		// Verify that no query calls the INSERT INTO statement
		expect(
			client.query.mock.calls.some(([sql]) =>
				String(sql).includes("INSERT INTO user_recommendation_cache")
			)
		).toBe(false);

		// 3) Commit transaction effects
		expect(client.query).toHaveBeenNthCalledWith(3, "COMMIT");
		expect(client.release).toHaveBeenCalledTimes(1);
	});

	it("Rolls back and releases the client when insertion fails", async () => {
		const error = new Error("Recommendation insertion failed");

		const recommendations = [
			{
				paperId: 101, finalScore: 0.91, contentScore: 0.82, collaborativeScore: 0.30,
				topicScore: 0.74, popularityScore: 0.50, recencyScore: 0.60, reason: "content"
			},
			{
				paperId: 102, finalScore: 0.84, contentScore: 0.40, collaborativeScore: 0.80,
				topicScore: 0.55, popularityScore: 0.35, recencyScore: 0.70, reason: "collaborative"
			}
		];

		// Mock each query statement based on the order of execution
		client.query
			.mockResolvedValueOnce(undefined) // BEGIN
			.mockResolvedValueOnce({ rowCount: 1 }) // DELETE
			.mockRejectedValueOnce(error) // INSERT
			.mockResolvedValueOnce(undefined); // ROLLBACK

		await expect(replaceUserRecommendationCache(42, recommendations))
			.rejects
			.toThrow("Recommendation insertion failed");

		expect(client.query).toHaveBeenLastCalledWith("ROLLBACK");
		expect(client.release).toHaveBeenCalledTimes(1);

		// Verify that the COMMIT statement was not executed
		expect(client.query.mock.calls.some(([sql]) => sql === "COMMIT")).toBe(false);
	});
});

describe("fetchUserRecommendationCacheByReason", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL CASE ----------

	it("filters recommendations by user, reason and limit", async () => {
		const rows = [
			{
				user_id: 42,
				paper_id: 101,
				reason: "content",
				final_score: 0.91
			}
		];

		pool.query.mockResolvedValue({ rows });

		const result = await fetchUserRecommendationCacheByReason(42, "content", 5);
		
		const [query, params] = pool.query.mock.calls[0];
		
		expect(query).toContain("SELECT *");
		expect(query).toContain("FROM user_recommendation_cache");
		expect(query).toContain("WHERE user_id = $1");
		expect(query).toContain("AND reason = $2");
		expect(query).toContain("ORDER BY final_score DESC");
		expect(query).toContain("LIMIT $3;");

		expect(params).toEqual([42, "content", 5]);

		expect(result).toEqual(rows);
	});
});

describe("deleteUserRecommendationCache", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL CASE ----------

	it("returns the number of deleted cache rows", async () => {
		pool.query.mockResolvedValue({ rowCount: 7 });

		const result = await deleteUserRecommendationCache(42);
		
		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("DELETE FROM user_recommendation_cache");
		expect(query).toContain("WHERE user_id = $1;");

		expect(params).toEqual([42]);

		expect(result).toEqual(7);
	});
});


