import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/repositories/recommendationProfileRepository.js", () => ({
	fetchUserProfilePreferences: vi.fn(),
	fetchAllUserProfilePreferences: vi.fn()
}));

vi.mock("../../../src/repositories/recommendationSimilarityRepository.js", () => ({
    replaceUserSimilarityCache: vi.fn()
}));

vi.mock("../../../src/algorithms/userSimilarity.js", () => ({
    userToUserSimilarity: vi.fn()
}));

import { 
	fetchUserProfilePreferences, 
	fetchAllUserProfilePreferences
} from "../../../src/repositories/recommendationProfileRepository.js";
import { replaceUserSimilarityCache } from "../../../src/repositories/recommendationSimilarityRepository.js";
import { userToUserSimilarity } from "../../../src/algorithms/userSimilarity.js";
import { rebuildUserSimilarityCache } from "../../../src/services/recommendationSimilarityService.js";


describe("rebuildUserSimilarityCache", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL RECOMPUTATION OF USER SIMILARITY CACHE ----------

	it("Rebuilds and stores user similarity cache", async () => {
		// Testing only topic_preferences and excluding (field_preferences, subfield_preferences, etc.)
		// to simplify the similarity calculations
		const userProfile = { id: 42, topic_preferences: { T1: 1 } };

		const allProfiles = [
			{ user_id: 42, topic_preferences: { T1: 1 } },
			{ user_id: 43, topic_preferences: { T1: 0.9 } },
			{ user_id: 44, topic_preferences: { T2: 1 } },
			{ user_id: 45, topic_preferences: { T1: 0.4 } }
		];

        fetchUserProfilePreferences.mockResolvedValue(userProfile);
        fetchAllUserProfilePreferences.mockResolvedValue(allProfiles);
		replaceUserSimilarityCache.mockResolvedValue(undefined);

		// Mocking the value synchronously
		userToUserSimilarity
    		.mockReturnValueOnce(0.85)
    		.mockReturnValueOnce(0)
    		.mockReturnValueOnce(0.45);
		
		const results = await rebuildUserSimilarityCache(42);

		const expectedSimilarities = [
			{ similarUserId: 43, similarityScore: 0.85 },
			{ similarUserId: 45, similarityScore: 0.45 }
		];

		expect(fetchUserProfilePreferences).toHaveBeenCalledWith(42);
        expect(fetchAllUserProfilePreferences).toHaveBeenCalledTimes(1);
        expect(userToUserSimilarity).toHaveBeenCalledTimes(3);
        expect(replaceUserSimilarityCache).toHaveBeenCalledWith(42, expectedSimilarities);

		expect(results).toEqual(expectedSimilarities);
	});


	it("Rebuilds and stores user similarity cache, keeping the top 50 similarities", async () => {
		const userProfile = { user_id: 42, topic_preferences: { T1: 1} };
		const allProfiles = [
			userProfile,
			...Array.from({ length: 60}, (_, index) => ({
				user_id: index + 100,
				topic_preferences: {
					T1: (index + 1) / 60,
					T2: 1 - (index + 1) / 60
				}
			}))
		];

		fetchUserProfilePreferences.mockResolvedValue(userProfile);
		fetchAllUserProfilePreferences.mockResolvedValue(allProfiles);
		userToUserSimilarity.mockReturnValue(0.5);
		replaceUserSimilarityCache.mockResolvedValue(undefined);

		const result = await rebuildUserSimilarityCache(42);

		expect(userToUserSimilarity).toHaveBeenCalledTimes(60);

		expect(result).toHaveLength(50);

		expect(replaceUserSimilarityCache).toHaveBeenCalledTimes(1);
		expect(replaceUserSimilarityCache).toHaveBeenCalledWith(
			42,
			expect.any(Array)
		);

		expect(replaceUserSimilarityCache.mock.calls[0][1]).toHaveLength(50);
	});

	// ---------- ERROR CASES ----------

	it("Throws 404 when the user profile doesn't exist", async () => {
		fetchAllUserProfilePreferences.mockResolvedValue(null);

		await expect(rebuildUserSimilarityCache(42)).rejects.toThrow("User profile preferences not found");

		expect(fetchAllUserProfilePreferences).not.toHaveBeenCalled();
		expect(userToUserSimilarity).not.toHaveBeenCalled();
		expect(replaceUserSimilarityCache).not.toHaveBeenCalled();
	});

	
	it("Propagates repository error", async () => {
		fetchUserProfilePreferences.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(rebuildUserSimilarityCache(42)).rejects.toThrow("Unexpected DB error");

        expect(replaceUserSimilarityCache).not.toHaveBeenCalled();
	});
});