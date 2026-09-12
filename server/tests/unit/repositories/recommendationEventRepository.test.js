import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
	default: {
		query: vi.fn()
	}
}));

import pool from "../../../src/config/db.js";

import {
	upsertPaperView,
	upsertPaperSave,
	upsertPaperUnsave,
	incrementPaperViewCount,
	decrementPaperSaveCount,
	incrementRecommendationClickCount
} from "../../../src/repositories/recommendationEventRepository.js";


describe("upsertPaperView", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns true when the paper view is recorded", async () => {
		pool.query.mockResolvedValue({ rowCount: 1 });

		const result = await upsertPaperView(42, 101);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("INSERT INTO user_paper_interactions");
		expect(query).toContain("ON CONFLICT (user_id, paper_id)");
		expect(query).toContain("view_count = user_paper_interactions.view_count + 1");
		expect(query).toContain("INTERVAL '1 second'");
		expect(query).toContain("RETURNING paper_id");

		expect(params).toEqual([42, 101]);
		expect(result).toBe(true);
	});

	it("Returns false when the duplicate-view guard prevents an update", async () => {
		pool.query.mockResolvedValue({ rowCount: 0 });

		const result = await upsertPaperView(42, 101);

		expect(result).toBe(false);
	});
});


describe("upsertPaperSave", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});
	
	it("Records a save only when the interaction is currently unsaved", async () => {
		pool.query.mockResolvedValue({ rowCount: 1 });

		const result = await upsertPaperSave(42, 101);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("UPDATE user_paper_interactions");
		expect(query).toContain("SET");
		expect(query).toContain("is_saved = true");
		expect(query).toContain("WHERE user_id = $1");
		expect(query).toContain("AND paper_id = $2");
		expect(query).toContain("AND is_saved = false");
		expect(query).toContain("RETURNING paper_id");

		expect(params).toEqual([42, 101]);
		expect(result).toBe(true);
	});

	it("Returns false when the paper was already saved", async () => {
		pool.query.mockResolvedValue({ rowCount: 0 });

		const result = await upsertPaperSave(42, 101);

		expect(result).toBe(false);
	});
});


describe("upsertPaperUnsave", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});
	

	it("Fetches the affected row count when an existing save is removed", async () => {
		pool.query.mockResolvedValue({ rowCount: 1 });

		const result = await upsertPaperUnsave(42, 101);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("UPDATE user_paper_interactions");
		expect(query).toContain("is_saved = false");
		expect(query).toContain("AND is_saved = true");
		expect(query).toContain("RETURNING paper_id");

		expect(params).toEqual([42, 101]);
		expect(result).toBe(1);
	});
});


describe("incrementPaperViewCount", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Increments the global paper view count", async () => {
		pool.query.mockResolvedValue({ rowCount: 1 });

		await incrementPaperViewCount(101);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("INSERT INTO paper_metrics");
		expect(query).toContain("VALUES ($1, 1, 0, 0, 0)");
		expect(query).toContain("ON CONFLICT (paper_id) DO UPDATE SET");
		expect(query).toContain(
			"view_count = paper_metrics.view_count + 1"
		);
		expect(query).toContain(
			"updated_at = CURRENT_TIMESTAMP"
		);

		expect(params).toEqual([101]);
		expect(pool.query).toHaveBeenCalledTimes(1);
	});
});


describe("decrementPaperSaveCount", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});
	
	it("Prevents the global save count from becoming negative", async () => {
		pool.query.mockResolvedValue({ rowCount: 1 });

		await decrementPaperSaveCount(101);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain(
			"GREATEST(save_count - 1, 0)"
		);

		expect(params).toEqual([101]);
	});
});


describe("incrementRecommendationClickCount", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Increments the global recommendation click count", async () => {
		pool.query.mockResolvedValue({ rowCount: 1 });

		await incrementRecommendationClickCount(101);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("INSERT INTO paper_metrics");
		expect(query).toContain("VALUES ($1, 0, 0, 1, 0)");
		expect(query).toContain("ON CONFLICT (paper_id) DO UPDATE SET");
		expect(query).toContain(
			"recommendation_click_count = paper_metrics.recommendation_click_count + 1"
		);
		expect(query).toContain(
			"updated_at = CURRENT_TIMESTAMP"
		);

		expect(params).toEqual([101]);
		expect(pool.query).toHaveBeenCalledTimes(1);
	});
});