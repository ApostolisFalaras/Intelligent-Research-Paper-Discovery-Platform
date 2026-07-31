import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
	default: {
		query: vi.fn(),
		connect: vi.fn()
	}
}));

import pool from "../../../src/config/db.js";
import pool from "../../../src/config/db.js";
import {
	upsertPaperSave,
	decrementPaperSaveCount } from "../../../src/repositories/recommendationEventRepository.js";

// Providing some representative tests of some functions, and not every single success/failure case

describe("upsertPaperSave", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Records a save interaction using the correct user and paper ids", async () => {
		pool.query.mockResolvedValue({ rowCount: 1 });

		await upsertPaperSave(42, 101);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("INSERT INTO user_paper_interactions (");
		expect(query).toContain("user_id, paper_id, view_count, is_saved, interest_score,");
		expect(query).toContain("first_viewed_at, last_interaction_at");
		expect(query).toContain(")");
		expect(query).toContain("VALUES ($1, $2, 1, true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
		expect(query).toContain("ON CONFLICT (user_id, paper_id) DO UPDATE SET");
		expect(query).toContain("is_saved = true,");
		expect(query).toContain("interest_score = user_paper_interactions.interest_score + 5,");
		expect(query).toContain("last_interaction_at = CURRENT_TIMESTAMP;");

		expect(params).toEqual([42, 101]);
	});
});

describe("decrementPaperSaveCount", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Uses GREATEST to prevent the global save count becoming negative", async () => {
		pool.query.mockResolvedValue({ rowCount: 1 });

		await decrementPaperSaveCount(101);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("UPDATE paper_metrics");
		expect(query).toContain("SET save_count = GREATEST(save_count - 1, 0),");
		expect(query).toContain("updated_at = CURRENT_TIMESTAMP");
		expect(query).toContain("WHERE paper_id = $1;");

		expect(params).toEqual([101]);
	});
});