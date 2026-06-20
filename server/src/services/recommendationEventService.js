import { 
	upsertPaperView,
	upsertPaperSave,
	upsertPaperUnsave,
	incrementPaperViewCount,
	incrementPaperSaveCount,
	decrementPaperSaveCount,
	incrementRecommendationClickCount } from "./../repositories/recommendationEventRepository.js";
import { markUserRecommendationsStale } from "./../repositories/recommendationRefreshRepository.js";
import { parseUserId, parseInteger } from "./../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";


// Helper method to reduce repetitive code
function validateUserAndPaperIds(userId, paperId) {
	// Validate user & paper ids
	const parsedUserId = parseUserId(userId);
    const parsedPaperId = parseInteger(paperId, "paper id");

	return [parsedUserId, parsedPaperId];
}

// Records a user's paper view
export async function recordPaperView(userId, paperId, isRecommendation) {
	const [parsedUserId, parsedPaperId] = validateUserAndPaperIds(userId, paperId);

	await upsertPaperView(parsedUserId, parsedPaperId);
	await incrementPaperViewCount(parsedPaperId);

	// A simple paper view has the lowest priority
	let reason = "paper_viewed";
	let priority = 1;

	if (isRecommendation) {
		await incrementRecommendationClickCount(parsedPaperId);
		// A paper view through a recommendation has higher priority
		reason = "recommendation_clicked";
		priority = 2;
	}

	await markUserRecommendationsStale(parsedUserId, reason, priority);
} 

// Records a user's paper save
export async function recordPaperSave(userId, paperId) {
	const [parsedUserId, parsedPaperId] = validateUserAndPaperIds(userId, paperId);

	await upsertPaperSave(parsedUserId, parsedPaperId);
	await incrementPaperSaveCount(parsedPaperId);

	// A paper save has the highest priority
	await markUserRecommendationsStale(parsedUserId, "paper_saved", 3);
}

// Records a user's paper un-save
export async function recordPaperUnsave(userId, paperId) {
	const [parsedUserId, parsedPaperId] = validateUserAndPaperIds(userId, paperId);

	await upsertPaperUnsave(parsedUserId, parsedPaperId);
	await decrementPaperSaveCount(parsedPaperId);

	// Also, a paper un-save has the highest priority
	await markUserRecommendationsStale(parsedUserId, "paper_unsaved", 3);
}