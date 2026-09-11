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

vi.mock("../../../src/repositories/popularityRefreshRepository.js", () => ({
    markPopularityDirty: vi.fn()
}));


import {
    upsertPaperView,
    upsertPaperSave,
    upsertPaperUnsave,
    incrementPaperViewCount,
    incrementPaperSaveCount,
    decrementPaperSaveCount,
    incrementRecommendationClickCount
} from "../../../src/repositories/recommendationEventRepository.js";

import {
    markUserRecommendationsStale
} from "../../../src/repositories/recommendationRefreshRepository.js";

import {
    markPopularityDirty
} from "../../../src/repositories/popularityRefreshRepository.js";

import {
    recordPaperView,
    recordPaperSave,
    recordPaperUnsave,
    recordPaperRecommendationClick
} from "../../../src/services/recommendationEventService.js";


describe("recordPaperView", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });


    // ---------- SUCCESSFUL CASES ----------

    it("Records paper view successfully", async () => {
        upsertPaperView.mockResolvedValue(true);
        incrementPaperViewCount.mockResolvedValue(undefined);
        markPopularityDirty.mockResolvedValue(undefined);
        markUserRecommendationsStale.mockResolvedValue(undefined);

        await recordPaperView(1, 386866);

        expect(upsertPaperView).toHaveBeenCalledWith(1, 386866);
        expect(incrementPaperViewCount).toHaveBeenCalledWith(386866);
        expect(markPopularityDirty).toHaveBeenCalledTimes(1);
        expect(markUserRecommendationsStale).toHaveBeenCalledWith(1, "paper_viewed", 1);
    });


    it("Does not update global metrics when the view was not newly recorded", async () => {
        upsertPaperView.mockResolvedValue(false);

        await recordPaperView(1, 386866);

        expect(upsertPaperView).toHaveBeenCalledWith(1, 386866);
        expect(incrementPaperViewCount).not.toHaveBeenCalled();
        expect(markPopularityDirty).not.toHaveBeenCalled();
        expect(markUserRecommendationsStale).not.toHaveBeenCalled();
    });


    // ---------- ERROR CASES ----------

    it("Propagates repository error when recording paper view fails", async () => {
        upsertPaperView.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(recordPaperView(1, 386866))
			.rejects
			.toThrow("Unexpected DB error");

        expect(incrementPaperViewCount).not.toHaveBeenCalled();
        expect(markPopularityDirty).not.toHaveBeenCalled();
        expect(markUserRecommendationsStale).not.toHaveBeenCalled();
    });
});


describe("recordPaperSave", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });


    // ---------- SUCCESSFUL CASES ----------

    it("Records paper save successfully", async () => {
        upsertPaperSave.mockResolvedValue(true);
        incrementPaperSaveCount.mockResolvedValue(undefined);
        markPopularityDirty.mockResolvedValue(undefined);
        markUserRecommendationsStale.mockResolvedValue(undefined);

        await recordPaperSave(1, 386866);

        expect(upsertPaperSave).toHaveBeenCalledWith(1, 386866);
        expect(incrementPaperSaveCount).toHaveBeenCalledWith(386866);
        expect(markPopularityDirty).toHaveBeenCalledTimes(1);
        expect(markUserRecommendationsStale).toHaveBeenCalledWith(1, "paper_saved", 3);
    });


    it("Does not update global metrics when save was not newly recorded", async () => {
        upsertPaperSave.mockResolvedValue(false);

        await recordPaperSave(1, 386866);

        expect(upsertPaperSave).toHaveBeenCalledWith(1, 386866);
        expect(incrementPaperSaveCount).not.toHaveBeenCalled();
        expect(markPopularityDirty).not.toHaveBeenCalled();
        expect(markUserRecommendationsStale).not.toHaveBeenCalled();
    });


    // ---------- ERROR CASES ----------

    it("Propagates repository error when recording paper save fails", async () => {
        upsertPaperSave.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(recordPaperSave(1, 386866))
			.rejects
			.toThrow("Unexpected DB error");

        expect(incrementPaperSaveCount).not.toHaveBeenCalled();
        expect(markPopularityDirty).not.toHaveBeenCalled();
        expect(markUserRecommendationsStale).not.toHaveBeenCalled();
    });
});


describe("recordPaperUnsave", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });


    // ---------- SUCCESSFUL CASES ----------

    it("Records paper unsave successfully", async () => {
        upsertPaperUnsave.mockResolvedValue(true);
        decrementPaperSaveCount.mockResolvedValue(undefined);
        markPopularityDirty.mockResolvedValue(undefined);
        markUserRecommendationsStale.mockResolvedValue(undefined);

        await recordPaperUnsave(1, 386866);

        expect(upsertPaperUnsave).toHaveBeenCalledWith(1, 386866);
        expect(decrementPaperSaveCount).toHaveBeenCalledWith(386866);
        expect(markPopularityDirty).toHaveBeenCalledTimes(1);
        expect(markUserRecommendationsStale).toHaveBeenCalledWith(1, "paper_unsaved", 3);
    });


    it("Does not update global metrics when unsave was not newly recorded", async () => {
        upsertPaperUnsave.mockResolvedValue(false);

        await recordPaperUnsave(1, 386866);

        expect(upsertPaperUnsave).toHaveBeenCalledWith(1, 386866);
        expect(decrementPaperSaveCount).not.toHaveBeenCalled();
        expect(markPopularityDirty).not.toHaveBeenCalled();
        expect(markUserRecommendationsStale).not.toHaveBeenCalled();
    });


    // ---------- ERROR CASES ----------

    it("Propagates repository error when recording paper unsave fails", async () => {
        upsertPaperUnsave.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(recordPaperUnsave(1, 386866))
			.rejects
			.toThrow("Unexpected DB error");

        expect(decrementPaperSaveCount).not.toHaveBeenCalled();
        expect(markPopularityDirty).not.toHaveBeenCalled();
        expect(markUserRecommendationsStale).not.toHaveBeenCalled();
    });
});


describe("recordPaperRecommendationClick", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });


    // ---------- SUCCESSFUL CASES ----------

    it("Records a recommendation click successfully", async () => {
        incrementRecommendationClickCount.mockResolvedValue(undefined);
        markPopularityDirty.mockResolvedValue(undefined);
        markUserRecommendationsStale.mockResolvedValue(undefined);

        
		await recordPaperRecommendationClick(1, 386866);


        expect(incrementRecommendationClickCount).toHaveBeenCalledWith(386866);

        expect(markPopularityDirty).toHaveBeenCalledTimes(1);

        expect(markUserRecommendationsStale).toHaveBeenCalledWith(1, "recommendation_clicked", 2);
    });


    // ---------- ERROR CASES ----------

    it("Propagates repository error when recommendation click recording fails", async () => {
        incrementRecommendationClickCount.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(recordPaperRecommendationClick(1, 386866))
			.rejects
			.toThrow("Unexpected DB error");

        expect(markPopularityDirty).not.toHaveBeenCalled();
        expect(markUserRecommendationsStale).not.toHaveBeenCalled();
    });
});