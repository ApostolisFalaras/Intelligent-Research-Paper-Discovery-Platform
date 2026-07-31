import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
	default: {
		query: vi.fn(),
		connect: vi.fn()
	}
}));

import pool from "../../../src/config/db.js";
import { replaceUserSimilarityCache, 
	     fetchTopSimilarUsers } from "../../../src/repositories/recommendationSimilarityRepository.js";


describe("replaceUserSimilarityCache", () => {
	let client;

	beforeEach(() => {
		vi.resetAllMocks();

		client = {
			query: vi.fn(),
			release: vi.fn()
		};

		pool.connect.mockResolvedValue(client);
	});

	// ---------- SUCCESSFUL CASES ----------

	it("Deletes the old cache and bulk-inserts new user similarities in one transaction", async () => {
		const similarities = [
			{ similarUserId: 43, similarityScore: 0.85 },
			{ similarUserId: 45, similarityScore: 0.61 }
		];

		client.query.mockResolvedValue({ rows: [], rowCount: 1 });

		await replaceUserSimilarityCache(42, similarities);

		expect(pool.connect).toHaveBeenCalledTimes(1);
		
		expect(client.query).toHaveBeenCalledTimes(4);

		// Verify all 4 client queries:
		// 1) Begin transaction
		expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");
		
		// 2) Delete old user similarity cache entries
		expect(client.query).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("DELETE FROM user_similarity_cache WHERE user_id = $1"),
			[42]
		);

		// 3) Bulk-insert new user similarity cache entries
		expect(client.query).toHaveBeenNthCalledWith(
			3,
			expect.stringContaining("INSERT INTO user_similarity_cache"),
			[
				42, 43, 0.85,
				42, 45, 0.61
			]
		);

		// Verify insertion placeholders
		const insertQuery = client.query.mock.calls[2][0];
		expect(insertQuery).toContain("($1, $2, $3, CURRENT_TIMESTAMP)");
		expect(insertQuery).toContain("($4, $5, $6, CURRENT_TIMESTAMP)");

		// 4) Commit transaction effects
		expect(client.query).toHaveBeenNthCalledWith(4, "COMMIT");
		expect(client.release).toHaveBeenCalledTimes(1);
	});

	it("Deletes the old cache without inserting when user similarities are empty", async () => {
		client.query.mockResolvedValue({ rows: [], rowCount: 1 });

		await replaceUserSimilarityCache(42, []);

		expect(pool.connect).toHaveBeenCalledTimes(1);

		expect(client.query).toHaveBeenCalledTimes(3);

		// Verify all 4 client queries:
		// 1) Begin transaction
		expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");

		// 2) Delete old user similarity cache entries
		expect(client.query).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("DELETE FROM user_similarity_cache WHERE user_id = $1"),
			[42]
		);

		// Verify that no query calls the INSERT INTO statement
		expect(
			client.query.mock.calls.some(([sql]) =>
				String(sql).includes("INSERT INTO user_similarity_cache")
			)
		).toBe(false);

		// 3) Commit transaction effects
		expect(client.query).toHaveBeenNthCalledWith(3, "COMMIT");
		expect(client.release).toHaveBeenCalledTimes(1);
	});

	it("Rolls back and releases the client when insertion fails", async () => {
		const error = new Error("Similarity insertion failed");

		// Mock each query statement based on the order of execution
		client.query
			.mockResolvedValueOnce(undefined) // BEGIN
			.mockResolvedValueOnce({ rowCount: 1 }) // DELETE
			.mockRejectedValueOnce(error) // INSERT
			.mockResolvedValueOnce(undefined); // ROLLBACK

		await expect(replaceUserSimilarityCache(42, [{ similarUserId: 43, similarityScore: 0.85 }]))
			.rejects
			.toThrow("Similarity insertion failed");

		expect(client.query).toHaveBeenLastCalledWith("ROLLBACK");
		expect(client.release).toHaveBeenCalledTimes(1);

		// Verify that the COMMIT statement was not executed
		expect(client.query.mock.calls.some(([sql]) => sql === "COMMIT")).toBe(false);
	});
});

describe("fetchTopSimilarUsers", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL CASE ----------

	it("Fetches the requested number of highest-scoring similar users", async () => {
		const rows = [
			{similar_user_id: 43, similarity_score: 0.85 },
			{ similar_user_id: 45, similarity_score: 0.61 }
		];

		pool.query.mockResolvedValue({ rows });

		const result = await fetchTopSimilarUsers(42, 10);
		
		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("SELECT *");
		expect(query).toContain("FROM user_similarity_cache");
		expect(query).toContain("WHERE user_id = $1");
		expect(query).toContain("ORDER BY similarity_score DESC");
		expect(query).toContain("LIMIT $2;");

		expect(params).toEqual([42, 10]);

		expect(result).toEqual(rows);
	});
});
