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
export async function recordPaperView(userId, paperId) {
	const [parsedUserId, parsedPaperId] = validateUserAndPaperIds(userId, paperId);

	const viewRecorded = await upsertPaperView(parsedUserId, parsedPaperId);

	// Safe-guard global (incrementPaperViewCount() call) duplicate paper view count 
	// from React's <StrictMode> re-render 
	if (!viewRecorded) {
		return;
	}

	await incrementPaperViewCount(parsedPaperId);

	await markUserRecommendationsStale(parsedUserId, "paper_viewed", 1);
} 

// Records a user's paper save
export async function recordPaperSave(userId, paperId) {
	const [parsedUserId, parsedPaperId] = validateUserAndPaperIds(userId, paperId);

	const saveRecorded = await upsertPaperSave(parsedUserId, parsedPaperId);

	// Safe-guard global (incrementPaperSaveCount() call) duplicate paper view count 
	// from React's <StrictMode> re-render 
	if (!saveRecorded) {
		return;
	}

	await incrementPaperSaveCount(parsedPaperId);

	// A paper save has the highest priority
	await markUserRecommendationsStale(parsedUserId, "paper_saved", 3);
}

// Records a user's paper un-save
export async function recordPaperUnsave(userId, paperId) {
	const [parsedUserId, parsedPaperId] = validateUserAndPaperIds(userId, paperId);

	const unsaveRecorded = await upsertPaperUnsave(parsedUserId, parsedPaperId);

	// Safe-guard global (decrementPaperSaveCount() call) duplicate paper view count 
	// from React's <StrictMode> re-render 
	if (!unsaveRecorded) {
		return;
	}

	await decrementPaperSaveCount(parsedPaperId);

	// Also, a paper un-save has the highest priority
	await markUserRecommendationsStale(parsedUserId, "paper_unsaved", 3);
}

// Records a user's recommendation click on a paper
export async function recordPaperRecommendationClick(userId, paperId) {
    const [parsedUserId, parsedPaperId] = validateUserAndPaperIds(userId, paperId);

    await incrementRecommendationClickCount(parsedPaperId);

    await markUserRecommendationsStale(parsedUserId, "recommendation_clicked", 2);
}