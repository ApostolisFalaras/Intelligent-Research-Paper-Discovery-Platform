import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
	default: {
		query: vi.fn(),
		connect: vi.fn()
	}
}));

import pool from "../../../src/config/db.js";
import {
	markUserRecommendationsStale,
	fetchStaleRecommendations,
	isUserRecommendationCacheStale } from "../../../src/repositories/recommendationRefreshRepository.js";


// Providing some representative tests of some functions, and not every single success/failure case

describe("markUserRecommendationsStale", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Upserts a pending refresh request with its reason and priority", async () => {
		pool.query.mockResolvedValue({ rowCount: 1 });

		await markUserRecommendationsStale(42, "paper_saved", 5);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("INSERT INTO recommendation_refresh_queue (");
		expect(query).toContain("user_id, reason, priority, requested_at, processed_at");
		expect(query).toContain(")");
		expect(query).toContain("VALUES ($1, $2, $3, CURRENT_TIMESTAMP, NULL)");
		expect(query).toContain("ON CONFLICT (user_id)");
		expect(query).toContain("WHERE processed_at IS NULL");
		expect(query).toContain("DO UPDATE SET");
		expect(query).toContain("reason = EXCLUDED.reason,");
		expect(query).toContain("priority = GREATEST(recommendation_refresh_queue.priority, EXCLUDED.priority),");
		expect(query).toContain("requested_at = CURRENT_TIMESTAMP,");
		expect(query).toContain("processed_at = NULL;");

		expect(params).toEqual([42, "paper_saved", 5]);
	});
});

describe("fetchStaleRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Fetches pending users ordered by priority and request age", async () => {
		const rows = [
			{ user_id: 42, reasons: ["paper_saved", "paper_viewed"], priority: 5 }
		];

		pool.query.mockResolvedValue({ rows });

		const result = await fetchStaleRecommendations(25);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("GROUP BY user_id");
		expect(query).toContain("MAX(priority) DESC");
		expect(query).toContain("MIN(requested_at) ASC");

		expect(params).toEqual([25]);

		expect(result).toEqual(rows);
	});
});

describe("isUserRecommendationCacheStale", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns true when pending=true and cache=true", async () => {
		pool.query.mockResolvedValue({
			rows: [{ has_pending_refresh: true,  has_cache: true }]
		});

		const result = await isUserRecommendationCacheStale(42);
		
		expect(result).toBe(true);
	});

	it("Returns true when pending=false and cache=false", async () => {
		pool.query.mockResolvedValue({
			rows: [{ has_pending_refresh: false,  has_cache: false }]
		});

		const result = await isUserRecommendationCacheStale(42);
		
		expect(result).toBe(true);
	});

	it("Returns true when pending=true and cache=false", async () => {
		pool.query.mockResolvedValue({
			rows: [{ has_pending_refresh: true,  has_cache: false }]
		});

		const result = await isUserRecommendationCacheStale(42);
		
		expect(result).toBe(true);
	});

	it("Returns false when pending=false and cache=true", async () => {
		pool.query.mockResolvedValue({
			rows: [{ has_pending_refresh: false,  has_cache: true }]
		});

		const result = await isUserRecommendationCacheStale(42);
		
		expect(result).toBe(false);
	});
});