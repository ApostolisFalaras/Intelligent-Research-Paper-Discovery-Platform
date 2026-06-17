import { 
	upsertPaperView,
	upsertPaperSave,
	upsertPaperUnsave,
	incrementPaperViewCount,
	incrementPaperSaveCount,
	decrementPaperSaveCount,
	incrementRecommendationClickCount } from "../repositories/recommendationEventRepository.js";
import { parseUserId, parseInteger } from "../utils/parseData.js";
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

	if (isRecommendation)
		await incrementRecommendationClickCount(parsedPaperId);
} 

// Records a user's paper save
export async function recordPaperSave(userId, paperId) {
	const [parsedUserId, parsedPaperId] = validateUserAndPaperIds(userId, paperId);

	await upsertPaperSave(parsedUserId, parsedPaperId);
	await incrementPaperSaveCount(parsedPaperId);
}

// Records a user's paper un-save
export async function recordPaperUnsave(userId, paperId) {
	const [parsedUserId, parsedPaperId] = validateUserAndPaperIds(userId, paperId);

	await upsertPaperUnsave(parsedUserId, parsedPaperId);
	await decrementPaperSaveCount(parsedPaperId);
}