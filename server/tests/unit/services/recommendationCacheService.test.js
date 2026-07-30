import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/repositories/recommendationProfileRepository.js", () => ({
    fetchUserProfilePreferences: vi.fn()
}));

vi.mock("../../../src/repositories/recommendationCandidateRepository.js", () => ({
    fetchCandidatePapersByTopics: vi.fn(),
    fetchCandidatePapersBySubfields: vi.fn(),
    fetchCandidatePapersFromSimilarUsers: vi.fn(),
    fetchCandidatePapersFromSavedPaper: vi.fn(),
    fetchCandidatePopularPapers: vi.fn(),
    fetchCandidateRecentPapers: vi.fn(),
    fetchExcludedPaperIds: vi.fn(),
    fetchCandidatePaperScoringRows: vi.fn()
}));

vi.mock("../../../src/repositories/recommendationCacheRepository.js", () => ({
    replaceUserRecommendationCache: vi.fn()
}));

vi.mock("../../../src/algorithms/contentBasedRecommendations.js", () => ({
    generateContentBasedRecommendations: vi.fn()
}));

vi.mock("../../../src/algorithms/collaborativeFiltering.js", () => ({
    generateCollaborativeRecommendations: vi.fn()
}));

vi.mock("../../../src/algorithms/topicRecommendations.js", () => ({
    generatePaperTopicScores: vi.fn()
}));

vi.mock("../../../src/algorithms/popularityScoring.js", () => ({
    calculatePopularityScores: vi.fn()
}));

vi.mock("../../../src/algorithms/hybridRecommendationScoring.js", () => ({
    calculateFinalRecommendationScores: vi.fn()
}));

import { fetchUserProfilePreferences } from "../../../src/repositories/recommendationProfileRepository.js";
import {
    fetchCandidatePapersByTopics,
    fetchCandidatePapersBySubfields,
    fetchCandidatePapersFromSimilarUsers,
    fetchCandidatePapersFromSavedPaper,
    fetchCandidatePopularPapers,
    fetchCandidateRecentPapers,
    fetchExcludedPaperIds,
    fetchCandidatePaperScoringRows
} from "../../../src/repositories/recommendationCandidateRepository.js";
import { replaceUserRecommendationCache } from "../../../src/repositories/recommendationCacheRepository.js";
import { generateContentBasedRecommendations } from "../../../src/algorithms/contentBasedRecommendations.js";
import { generateCollaborativeRecommendations } from "../../../src/algorithms/collaborativeFiltering.js";
import { generatePaperTopicScores } from "../../../src/algorithms/topicRecommendations.js";
import { calculatePopularityScores } from "../../../src/algorithms/popularityScoring.js";
import { calculateFinalRecommendationScores } from "../../../src/algorithms/hybridRecommendationScoring.js";

import { rebuildUserRecommendationCache } from "../../../src/services/recommendationCacheService.js";

describe("rebuildUserRecommendationCache", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	
    // ---------- SUCCESSFUL CASES ----------
    
    it("Rebuilds and stores user's recommendation cache", async () => {
        // Using a minimal set of profile preferences,
        const userProfile = {
            user_id: 42,
            topic_preferences: { T1: 0.5, T2: 0.3, T3: 0.2 },
            subfield_preferences: { SF1: 0.6, SF2: 0.4 }
        };

        // and candidate of each candidate category
        const topicCandidates = [{ paper_id: 101 }, { paper_id: 102 }];
        const subfieldCandidates = [{ paper_id: 102 }, { paper_id: 103 }];
        const popularCandidates = [{ paper_id: 104 }];
        const recentCandidates = [{ paper_id: 105 }];
        const savedPaperCandidates = [{ paper_id: 106 }];
        const collaborativeCandidates = [{ user_id: 50, paper_id: 107, interest_score: 5, similarity_score: 0.8 }];
        const excludedIds = [103];

        const hydratedPapers = [
            { paper_id: 101, topic_vector: { T1: 1 }, recency_score: 0.8 },
            { paper_id: 102, topic_vector: { T2: 1 }, recency_score: 0.7 },
            { paper_id: 104, topic_vector: { T3: 1 }, recency_score: 0.6 },
            { paper_id: 105, topic_vector: { T1: 1 }, recency_score: 1 },
            { paper_id: 106, topic_vector: { T2: 1 }, recency_score: 0.9 },
            { paper_id: 107, topic_vector: { T1: 1 }, recency_score: 0.5 }
        ];

        const contentRecommendations = [{ paperId: 101, contentScore: 0.9 }];

        const collaborativeRecommendations = [{ paperId: 107, collaborativeScore: 0.8 }];

        const topicScores = [{ paperId: 101, topicScore: 0.7 }];

        const popularityScores = [{ paperId: 104, popularityScore: 0.6 }];

        const finalRecommendations = Array.from({ length: 120 }, (_, index) => ({
            paperId: index + 1,
            finalScore: 1 - index * 0.001,
            contentScore: 0.5,
            collaborativeScore: 0.2,
            topicScore: 0.3,
            popularityScore: 0.1,
            recencyScore: 0.4,
            reason: "because_of_your_interests"
        }));
        

        fetchUserProfilePreferences.mockResolvedValue(userProfile);

        fetchCandidatePapersByTopics.mockResolvedValue(topicCandidates);
        fetchCandidatePapersBySubfields.mockResolvedValue(subfieldCandidates);
        fetchCandidatePopularPapers.mockResolvedValue(popularCandidates);
        fetchCandidateRecentPapers.mockResolvedValue(recentCandidates);
        fetchCandidatePapersFromSavedPaper.mockResolvedValue(savedPaperCandidates);
        fetchCandidatePapersFromSimilarUsers.mockResolvedValue(collaborativeCandidates);
        fetchExcludedPaperIds.mockResolvedValue(excludedIds);
        fetchCandidatePaperScoringRows.mockResolvedValue(hydratedPapers);

        generateContentBasedRecommendations.mockReturnValue(contentRecommendations);
        generateCollaborativeRecommendations.mockReturnValue(collaborativeRecommendations);
        generatePaperTopicScores.mockReturnValue(topicScores);
        calculatePopularityScores.mockReturnValue(popularityScores);
        calculateFinalRecommendationScores.mockReturnValue(finalRecommendations);

        replaceUserRecommendationCache.mockResolvedValue(undefined);

        const result = await rebuildUserRecommendationCache(42);

        expect(fetchUserProfilePreferences).toHaveBeenCalledWith(42);
        expect(fetchCandidatePapersByTopics).toHaveBeenCalledWith(["T1", "T2", "T3"], 3000);
        expect(fetchCandidatePapersBySubfields).toHaveBeenCalledWith(["SF1", "SF2"], 1500);
        expect(fetchCandidatePopularPapers).toHaveBeenCalledWith(1000);
        expect(fetchCandidateRecentPapers).toHaveBeenCalledWith(1000);
        expect(fetchCandidatePapersFromSavedPaper).toHaveBeenCalledWith(42, 1000);
        expect(fetchCandidatePapersFromSimilarUsers).toHaveBeenCalledWith(42, 5000);
        expect(fetchExcludedPaperIds).toHaveBeenCalledWith(42);

        expect(fetchCandidatePaperScoringRows).toHaveBeenCalledWith([101, 102, 104, 106, 105, 107]);
        
        const excludedPaperIds = new Set([103]);

        expect(generateContentBasedRecommendations).toHaveBeenCalledWith(userProfile, hydratedPapers, excludedPaperIds);
        expect(generateContentBasedRecommendations).toHaveBeenCalledWith(userProfile, hydratedPapers, excludedPaperIds);
        expect(generateCollaborativeRecommendations).toHaveBeenCalledWith(collaborativeCandidates, excludedPaperIds);
        expect(generatePaperTopicScores).toHaveBeenCalledWith(userProfile, hydratedPapers);
        expect(calculatePopularityScores).toHaveBeenCalledWith(hydratedPapers);
        expect(calculateFinalRecommendationScores).toHaveBeenCalledWith(
            contentRecommendations,
            collaborativeRecommendations,
            topicScores,
            popularityScores,
            hydratedPapers
        );

        expect(replaceUserRecommendationCache).toHaveBeenCalledWith(42, finalRecommendations.slice(0, 100));
        
        expect(result).toEqual(finalRecommendations.slice(0, 100));
    });


    it("Excluded already interacted papers before hydration", async () => {
        const userProfile = { 
            user_id: 42, 
            topic_preferences: {T1: 1}, 
            subfield_preferences: {SF1: 1}
        };

        fetchUserProfilePreferences.mockResolvedValue(userProfile);

        fetchCandidatePapersByTopics.mockResolvedValue([{ paper_id: 101 }]);
        fetchCandidatePapersBySubfields.mockResolvedValue([{ paper_id: 102 }]);
        fetchCandidatePopularPapers.mockResolvedValue([{ paper_id: 103 }]);
        fetchCandidateRecentPapers.mockResolvedValue([]);
        fetchCandidatePapersFromSavedPaper.mockResolvedValue([]);
        fetchCandidatePapersFromSimilarUsers.mockResolvedValue([]);
        fetchExcludedPaperIds.mockResolvedValue([102]);

        fetchCandidatePaperScoringRows.mockResolvedValue([
            { paper_id: 101 },
            { paper_id: 103 }
        ]);

        // Not providing recommendations, since this is not the point of focus on this test
        generateContentBasedRecommendations.mockReturnValue([]);
        generateCollaborativeRecommendations.mockReturnValue([]);
        generatePaperTopicScores.mockReturnValue([]);
        calculatePopularityScores.mockReturnValue([]);
        calculateFinalRecommendationScores.mockReturnValue([]);

        replaceUserRecommendationCache.mockResolvedValue(undefined);     
        
        await rebuildUserRecommendationCache(42);

        expect(fetchCandidatePaperScoringRows).toHaveBeenCalledWith([101, 103]);
    });

    // ---------- ERROR CASES ----------

    it("Propagates repository error", async () => {
        fetchUserProfilePreferences.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(rebuildUserRecommendationCache(42)).rejects.toThrow("Unexpected DB error");

        expect(replaceUserRecommendationCache).not.toHaveBeenCalled();
    });

});