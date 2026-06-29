import { 
	getHomeRecommendations,
	getContentRecommendations,
	getUserRecommendations,
	getTopicRecommendations
} from "./../services/recommendationService.js";


// Home recommendations when the user enters the app's home page
export async function getHomeRecommendationsController(req, res, next) {
	try {
		const recommendations = await getHomeRecommendations(req.user?.id);

		return res.status(200).json({
			status: "success",
			data: recommendations
		});
	} catch (error) {
		next(error);
	}
}

// User views all content-based recommendations
export async function getContentRecommendationsController(req, res, next) {
	try {
		const recommendations = await getContentRecommendations(req.user.id, req.query.page, req.query.limit);

		return res.status(200).json({
			status: "success",
			data: recommendations
		});
	} catch (error) {
		next(error);
	}
}

// User views all user-based recommendations
export async function getUserRecommendationsController(req, res, next) {
	try {
		const recommendations = await getUserRecommendations(req.user.id, req.query.page, req.query.limit);

		return res.status(200).json({
			status: "success",
			data: recommendations
		});
	} catch (error) {
		next(error);
	}
}

// User views all topic-based recommendations
export async function getTopicRecommendationsController(req, res, next) {
	try {
		const recommendations = await getTopicRecommendations(req.user.id, req.query.page, req.query.limit);

		return res.status(200).json({
			status: "success",
			data: recommendations
		});
	} catch (error) {
		next(error);
	}
}