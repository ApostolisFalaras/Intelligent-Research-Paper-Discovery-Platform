import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/services/recommendationCacheService.js", () => ({
	rebuildUserRecommendationCache: vi.fn()
}));

vi.mock("../../../src/services/recommendationProfileService.js", () => ({
	rebuildUserProfilePreferences: vi.fn()
}));

vi.mock("../../../src/services/recommendationSimilarityService.js", () => ({
	rebuildUserSimilarityCache: vi.fn()
}));

vi.mock("../../../src/repositories/recommendationRefreshRepository.js", () => ({
	fetchStaleRecommendations: vi.fn(),
	markUserRecommendationsProcessed: vi.fn()
}));

import { rebuildUserRecommendationCache } from "../../../src/services/recommendationCacheService.js";
import { rebuildUserProfilePreferences } from "../../../src/services/recommendationProfileService.js";
import { rebuildUserSimilarityCache } from "../../../src/services/recommendationSimilarityService.js";
import { fetchStaleRecommendations, markUserRecommendationsProcessed } from "../../../src/repositories/recommendationRefreshRepository.js";
import { rebuildStaleUserRecommendations } from "../../../src/services/recommendationJobService.js";

describe("rebuildStaleUserRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL CASES ----------

	it("Rebuilds all stale users successfully", async () => {
		fetchStaleRecommendations.mockResolvedValue([{ user_id: 42 }, { user_id: 43 }]);

		rebuildUserProfilePreferences.mockResolvedValue(undefined);
		rebuildUserSimilarityCache.mockResolvedValue(undefined);
		rebuildUserRecommendationCache.mockResolvedValue(undefined);
		markUserRecommendationsProcessed.mockResolvedValue(undefined);

		const result = await rebuildStaleUserRecommendations(50);

		expect(fetchStaleRecommendations).toHaveBeenCalledWith(50);

        expect(rebuildUserProfilePreferences).toHaveBeenCalledWith(42);
        expect(rebuildUserSimilarityCache).toHaveBeenCalledWith(42);
        expect(rebuildUserRecommendationCache).toHaveBeenCalledWith(42);
        expect(markUserRecommendationsProcessed).toHaveBeenCalledWith(42);

        expect(rebuildUserProfilePreferences).toHaveBeenCalledWith(43);
        expect(rebuildUserSimilarityCache).toHaveBeenCalledWith(43);
        expect(rebuildUserRecommendationCache).toHaveBeenCalledWith(43);
        expect(markUserRecommendationsProcessed).toHaveBeenCalledWith(43);

        expect(result).toEqual([
            { userId: 42, status: "success" },
            { userId: 43, status: "success" }
        ]);
	});

	it("Continues processing even when one user fails", async () => {
		fetchStaleRecommendations.mockResolvedValue([{ user_id: 42 }, { user_id: 43 }]);

        rebuildUserProfilePreferences
            .mockRejectedValueOnce(new Error("Profile rebuild failed"))
            .mockResolvedValueOnce(undefined);

        rebuildUserSimilarityCache.mockResolvedValue(undefined);
        rebuildUserRecommendationCache.mockResolvedValue(undefined);
        markUserRecommendationsProcessed.mockResolvedValue(undefined);

        const result = await rebuildStaleUserRecommendations(50);

		expect(result).toEqual([
            { userId: 42, status: "failed", message: "Profile rebuild failed" },
            { userId: 43, status: "success" }
        ]);

        expect(markUserRecommendationsProcessed).toHaveBeenCalledTimes(1);
        expect(markUserRecommendationsProcessed).toHaveBeenCalledWith(43);
	});

	it("Returns an empty array when there are no stale users", async () => {
		fetchStaleRecommendations.mockResolvedValue([]);

		rebuildUserProfilePreferences.mockResolvedValue(undefined);
		rebuildUserSimilarityCache.mockResolvedValue(undefined);
		rebuildUserRecommendationCache.mockResolvedValue(undefined);
		markUserRecommendationsProcessed.mockResolvedValue(undefined);

		const result = await rebuildStaleUserRecommendations(50);

		expect(rebuildUserProfilePreferences).not.toHaveBeenCalled();
		expect(rebuildUserSimilarityCache).not.toHaveBeenCalled();
		expect(rebuildUserRecommendationCache).not.toHaveBeenCalled();
		expect(markUserRecommendationsProcessed).not.toHaveBeenCalled();

		expect(result).toEqual([]);
	});

	// ---------- ERROR CASES ----------

	it("Throws 400 when the 'limit' is invalid", async () => {
		await expect(rebuildStaleUserRecommendations(0)).rejects.toThrow("'limit' must be between 1 and 500");

        expect(fetchStaleRecommendations).not.toHaveBeenCalled();
		expect(rebuildUserProfilePreferences).not.toHaveBeenCalled();
		expect(rebuildUserSimilarityCache).not.toHaveBeenCalled();
		expect(rebuildUserRecommendationCache).not.toHaveBeenCalled();
		expect(markUserRecommendationsProcessed).not.toHaveBeenCalled();
	});

	it("Propagates stale-user fetch errors", async () => {
		fetchStaleRecommendations.mockRejectedValue(new Error("Unexpected DB error"));

		await expect(rebuildStaleUserRecommendations(50)).rejects.toThrow("Unexpected DB error");

		expect(rebuildUserProfilePreferences).not.toHaveBeenCalled();
		expect(rebuildUserSimilarityCache).not.toHaveBeenCalled();
		expect(rebuildUserRecommendationCache).not.toHaveBeenCalled();
		expect(markUserRecommendationsProcessed).not.toHaveBeenCalled();
	});
});