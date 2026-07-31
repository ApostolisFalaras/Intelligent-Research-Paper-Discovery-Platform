import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
	default: {
		query: vi.fn(),
		connect: vi.fn(),
	}
}));

import pool from "../../../src/config/db.js";
import { replacePaperSimilarityCache,
	     fetchPaperRecommendationFeatures } from "../../../src/repositories/paperSimilarityRepository.js";


describe("replacePaperSimilarityCache", () => {
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

	it("Deletes the old cache and bulk-inserts new paper similarities in one transaction", async () => {
		const similarPapers = [
			{ similar_paper_id: 102, similarity_score: 0.91, reason: "shared_topics" },
			{ similar_paper_id: 103, similarity_score: 0.84, reason: "shared_authors" }
		];

		client.query.mockResolvedValue({ rows: [], rowCount: 1 });

		await replacePaperSimilarityCache(101, similarPapers);

		expect(pool.connect).toHaveBeenCalledTimes(1);
		
		expect(client.query).toHaveBeenCalledTimes(4);

		// Verify all 4 client queries:
		// 1) Begin transaction
		expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");
		
		// 2) Delete old user similarity cache entries
		expect(client.query).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("DELETE FROM paper_similarity_cache WHERE paper_id = $1"),
			[101]
		);

		// 3) Bulk-insert new user similarity cache entries
		expect(client.query).toHaveBeenNthCalledWith(
			3,
			expect.stringContaining("INSERT INTO paper_similarity_cache"),
			[
				101, 102, 0.91, "shared_topics",
				101, 103, 0.84, "shared_authors"
			]
		);

		// Verify insertion placeholders
		const insertQuery = client.query.mock.calls[2][0];
		expect(insertQuery).toContain("($1, $2, $3, $4, CURRENT_TIMESTAMP)");
		expect(insertQuery).toContain("($5, $6, $7, $8, CURRENT_TIMESTAMP)");

		// 4) Commit transaction effects
		expect(client.query).toHaveBeenNthCalledWith(4, "COMMIT");
		expect(client.release).toHaveBeenCalledTimes(1);
	});

	it("Deletes the old cache without inserting when paper similarities are empty", async () => {
		client.query.mockResolvedValue({ rows: [], rowCount: 1 });

		await replacePaperSimilarityCache(101, []);

		expect(pool.connect).toHaveBeenCalledTimes(1);

		expect(client.query).toHaveBeenCalledTimes(3);

		// Verify all 4 client queries:
		// 1) Begin transaction
		expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");

		// 2) Delete old user similarity cache entries
		expect(client.query).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("DELETE FROM paper_similarity_cache WHERE paper_id = $1"),
			[101]
		);

		// Verify that no query calls the INSERT INTO statement
		expect(
			client.query.mock.calls.some(([sql]) =>
				String(sql).includes("INSERT INTO paper_similarity_cache")
			)
		).toBe(false);

		// 3) Commit transaction effects
		expect(client.query).toHaveBeenNthCalledWith(3, "COMMIT");
		expect(client.release).toHaveBeenCalledTimes(1);
	});

	it("Rolls back and releases the client when insertion fails", async () => {
		const error = new Error("Recommendation insertion failed");

		const similarPapers = [
			{ similar_paper_id: 102, similarity_score: 0.91, reason: "shared_topics" },
			{ similar_paper_id: 103, similarity_score: 0.84, reason: "shared_authors" }
		];

		// Mock each query statement based on the order of execution
		client.query
			.mockResolvedValueOnce(undefined) // BEGIN
			.mockResolvedValueOnce({ rowCount: 1 }) // DELETE
			.mockRejectedValueOnce(error) // INSERT
			.mockResolvedValueOnce(undefined); // ROLLBACK

		await expect(replacePaperSimilarityCache(42, similarPapers))
			.rejects
			.toThrow("Recommendation insertion failed");

		expect(client.query).toHaveBeenLastCalledWith("ROLLBACK");
		expect(client.release).toHaveBeenCalledTimes(1);

		// Verify that the COMMIT statement was not executed
		expect(client.query.mock.calls.some(([sql]) => sql === "COMMIT")).toBe(false);
	});
});

describe("fetchPaperRecommendationFeatures", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL CASE ----------

	it("Returns null when recommendation features do not exist", async () => {
		pool.query.mockResolvedValue({ rows: [] });

		const result = await fetchPaperRecommendationFeatures(101);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("SELECT *");
		expect(query).toContain("FROM paper_recommendation_features");
		expect(query).toContain("WHERE paper_id = $1;");

		expect(params).toEqual([101]);

		expect(result).toBeNull();
	});
});