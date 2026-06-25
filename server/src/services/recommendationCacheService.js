import { fetchUserProfilePreferences } from "./../repositories/recommendationProfileRepository.js";
import { fetchTopSimilarUsers } from "../repositories/recommendationSimilarityRepository.js";
import {
	fetchCandidatePapersByTopics,
	fetchCandidatePapersBySubfields,
	fetchCandidatePapersFromSimilarUsers,
	fetchCandidatePapersFromSavedPaper,
	fetchCandidatePopularPapers,
	fetchCandidateRecentPapers,
	fetchExcludedPaperIds,
	fetchCandidatePaperScoringRows
} from "./../repositories/recommendationCandidateRepository.js";

import { replaceUserRecommendationCache } from "./../repositories/recommendationCacheRepository.js";

import { generateContentBasedRecommendations } from "./../algorithms/contentBasedRecommendations.js";
import { generateCollaborativeRecommendations } from "./../algorithms/collaborativeFiltering.js";
import { calculatePaperTopicScores } from "./../algorithms/topicRecommendations.js";
import { calculatePopularityScores } from "./../algorithms/popularityScoring.js";
import { calculateFinalRecommendationScores } from "./../algorithms/hybridRecommendationScoring.js";

import { parseUserId } from "./../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";


// Helper function that extracts the most important item keys from a vector
function getTopKeys(vector = {}, limit = 10) {
	return Object.entries(vector)
		.sort(([,a], [,b]) => Number(b) - Number(a))
		.slice(0, limit)
		.map(([key]) => key);
}

// Helper function that generates a deduplicated array of papers, 
// using a Map structure that doesn't allow duplicate keys (paper ids)
function deduplicatePaperIds(papers = []) {
	return [
		...new Set(papers.map(paper => Number(paper.paper_id)))
	];
}

export async function rebuildUserRecommendationCache(userId) {
	const parsedUserId = parseUserId(userId);

	const userProfile = await fetchUserProfilePreferences(parsedUserId);

	if (!userProfile)
		throw new AppError("User profile preferences not found", 404);

	const topTopicsIds = getTopKeys(userProfile.topic_preferences, 5);
	const topSubfieldIds = getTopKeys(userProfile.subfield_preferences, 10);

	// Fetching portions of candidate papers using all available criteria:
	// topics, subfields, popularity, recency, similar users,
	// as well as the papers the current user interacted with to exclude them  
	const [
		topicCandidates,
		subfieldCandidates,
		popularCandidates,
		recentCandidates,
		savedPaperCandidates,
		collaborativeCandidates,
		excludedIds
	] = await Promise.all([
		fetchCandidatePapersByTopics(topTopicsIds, 3000),
		fetchCandidatePapersBySubfields(topSubfieldIds, 1500),
		fetchCandidatePopularPapers(1000),
		fetchCandidateRecentPapers(1000),
		fetchCandidatePapersFromSavedPaper(parsedUserId, 1000),
		fetchCandidatePapersFromSimilarUsers(parsedUserId, 5000),
		fetchExcludedPaperIds(parsedUserId)
	]);

	// Forming the final set of candidate paper ids
	const excludedPaperIds = new Set(excludedIds.map(Number));
	const candidatePaperIds = deduplicatePaperIds([
		...topicCandidates,
		...subfieldCandidates,
		...popularCandidates,
		...recentCandidates,
		...collaborativeCandidates
	]).filter(paperId => !excludedPaperIds.has(paperId));

	// Fetching all the fields required from content-based, topic, & popularity scoring algorithms
	const candidatePapers = fetchCandidatePaperScoringRows(candidatePaperIds);

	// Generating all different types of recommendation scores
	// 1) Content-Based Recommendation Scores
	const contentRecommendations = generateContentBasedRecommendations(
		userProfile, 
		candidatePapers,
		excludedPaperIds	
	);

	// 2) Collaborative Recommendation Scores
	const collaborativeRecommendations = generateCollaborativeRecommendations(
		collaborativeCandidates,
		excludedPaperIds
	);

	// 3) Topic Recommendation Scores
	const topicScores = calculatePaperTopicScores(userProfile, candidatePapers);

	// 4) Popularity Recommendation Scores
	const popularityScores = calculatePopularityScores(candidatePapers);

	// And aggregating them to calculate the final top 100 recommendations
	const finalRecommendations = calculateFinalRecommendationScores(
		contentRecommendations,
		collaborativeRecommendations,
		topicScores,
		popularityScores,
		candidatePapers
	);

	const topRecommendations = finalRecommendations.slice(0,100);

	// which actually update the user's recommendation cache
	await replaceUserRecommendationCache(parsedUserId, topRecommendations);

	return topRecommendations;
}

