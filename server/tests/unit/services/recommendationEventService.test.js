import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/repositories/recommendationEventRepository.js", () => ({
	upsertPaperView: vi.fn(),
	upsertPaperSave: vi.fn(),
	upsertPaperUnsave: vi.fn(),
	incrementPaperViewCount: vi.fn(),
	incrementPaperSaveCount: vi.fn(),
	decrementPaperSaveCount: vi.fn(),
	incrementRecommendationClickCount: vi.fn()
}));

vi.mock("../../../src/repositories/recommendationRefreshRepository.js", () => ({
	markUserRecommendationsStale: vi.fn()
}));



import { 
	upsertPaperView,
	upsertPaperSave,
	upsertPaperUnsave,
	incrementPaperViewCount,
	incrementPaperSaveCount,
	decrementPaperSaveCount,
	incrementRecommendationClickCount } from "../../../src/repositories/recommendationEventRepository.js";
import { markUserRecommendationsStale } from "../../../src/repositories/recommendationRefreshRepository.js";
import { recordPaperView, recordPaperSave, recordPaperUnsave } from "../../../src/services/recommendationEventService.js";

describe("recordPaperView", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL TESTS ----------

	it("Record paper view successfully", async () => {
		upsertPaperView.mockResolvedValue(null);
		incrementPaperViewCount.mockResolvedValue(null);
		markUserRecommendationsStale.mockResolvedValue(null);

		await recordPaperView(1, 386866, false);

		expect(upsertPaperView).toHaveBeenCalledWith(1, 386866);
		expect(upsertPaperView).toHaveBeenCalledTimes(1);

		expect(incrementPaperViewCount).toHaveBeenCalledWith(386866);
		expect(incrementPaperViewCount).toHaveBeenCalledTimes(1);

		expect(incrementRecommendationClickCount).not.toHaveBeenCalled();

		expect(markUserRecommendationsStale).toHaveBeenCalledWith(1, "paper_viewed", 1);
		expect(markUserRecommendationsStale).toHaveBeenCalledTimes(1);
	});

	it("Record paper view successfully as a recommendation", async () => {
		upsertPaperView.mockResolvedValue(null);
		incrementPaperViewCount.mockResolvedValue(null);
		markUserRecommendationsStale.mockResolvedValue(null);

		await recordPaperView(1, 386866, true);

		expect(upsertPaperView).toHaveBeenCalledWith(1, 386866);
		expect(upsertPaperView).toHaveBeenCalledTimes(1);

		expect(incrementPaperViewCount).toHaveBeenCalledWith(386866);
		expect(incrementPaperViewCount).toHaveBeenCalledTimes(1);

		expect(incrementRecommendationClickCount).toHaveBeenCalledWith(386866);
		expect(incrementRecommendationClickCount).toHaveBeenCalledTimes(1);
		
		expect(markUserRecommendationsStale).toHaveBeenCalledWith(1, "recommendation_clicked", 2);
		expect(markUserRecommendationsStale).toHaveBeenCalledTimes(1);
	});

	// ---------- DB ERROR ----------

	it("Record paper view failed", async () => {
		upsertPaperView.mockRejectedValue(new Error("Unexpected DB error"));

		// Similar ERROR TESTS could be produced for these 2 functions
		incrementPaperViewCount.mockResolvedValue(null);
		markUserRecommendationsStale.mockResolvedValue(null);

		await expect(recordPaperView(1, 386866, false)).rejects.toThrow("Unexpected DB error");

		expect(upsertPaperView).toHaveBeenCalledWith(1, 386866);
		expect(upsertPaperView).toHaveBeenCalledTimes(1);

		expect(incrementPaperViewCount).not.toHaveBeenCalled();
		expect(markUserRecommendationsStale).not.toHaveBeenCalled();
	});
});


describe("recordPaperSave", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL TESTS ----------

	it("Record paper save successfully", async () => {
		upsertPaperSave.mockResolvedValue(null);
		incrementPaperSaveCount.mockResolvedValue(null);
		markUserRecommendationsStale.mockResolvedValue(null);

		await recordPaperSave(1, 386866);

		expect(upsertPaperSave).toHaveBeenCalledWith(1, 386866);
		expect(upsertPaperSave).toHaveBeenCalledTimes(1);

		expect(incrementPaperSaveCount).toHaveBeenCalledWith(386866);
		expect(incrementPaperSaveCount).toHaveBeenCalledTimes(1);

		expect(markUserRecommendationsStale).toHaveBeenCalledWith(1, "paper_saved", 3);
		expect(markUserRecommendationsStale).toHaveBeenCalledTimes(1);
	});

	// ---------- DB ERROR ----------

	it("Record paper save failed", async () => {
		upsertPaperSave.mockRejectedValue(new Error("Unexpected DB error"));

		// Similar error tests could be produced for these 2 functions:
		// inrementPaperSaveCount, markUserRecommendationsStale

		await expect(recordPaperSave(1, 386866)).rejects.toThrow("Unexpected DB error");

		expect(upsertPaperSave).toHaveBeenCalledWith(1, 386866);
		expect(upsertPaperSave).toHaveBeenCalledTimes(1);

		expect(incrementPaperSaveCount).not.toHaveBeenCalled();
		expect(markUserRecommendationsStale).not.toHaveBeenCalled();
	});
});


describe("recordPaperUnsave", () => {
	beforeEach(() => {
		vi.resetAllMocks();

	});

	// ---------- SUCCESSFUL TESTS ----------

	it("Record paper unsave successfully", async () => {
		upsertPaperUnsave.mockResolvedValue(null);
		decrementPaperSaveCount.mockResolvedValue(null);
		markUserRecommendationsStale.mockResolvedValue(null);

		await recordPaperUnsave(1, 386866, false);

		expect(upsertPaperUnsave).toHaveBeenCalledWith(1, 386866);
		expect(upsertPaperUnsave).toHaveBeenCalledTimes(1);

		expect(decrementPaperSaveCount).toHaveBeenCalledWith(386866);
		expect(decrementPaperSaveCount).toHaveBeenCalledTimes(1);

		expect(markUserRecommendationsStale).toHaveBeenCalledWith(1, "paper_unsaved", 3);
		expect(markUserRecommendationsStale).toHaveBeenCalledTimes(1);
	});

	// ---------- DB ERROR ----------

	it("Record paper unsave failed", async () => {
		upsertPaperUnsave.mockRejectedValue(new Error("Unexpected DB error"));

		// Similar error tests could be produced for these 2 functions:
		// decrementPaperSaveCount, markUserRecommendationsStale

		await expect(recordPaperUnsave(1, 386866)).rejects.toThrow("Unexpected DB error");

		expect(upsertPaperUnsave).toHaveBeenCalledWith(1, 386866);
		expect(upsertPaperUnsave).toHaveBeenCalledTimes(1);

		expect(decrementPaperSaveCount).not.toHaveBeenCalled();
		expect(markUserRecommendationsStale).not.toHaveBeenCalled();
	});
});