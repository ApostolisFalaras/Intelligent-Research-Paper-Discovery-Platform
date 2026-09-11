import { 
	getHomeRecommendations,
	getRecommendationsPage
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

export async function getRecommendationsPageController(req, res, next) {
	try {
		const recommendations = await getRecommendationsPage(
			req.user?.id,
			req.query.type ?? "activity",
			req.query.page,
			req.query.limit
		);

		return res.status(200).json({
			status: "success",
			data: recommendations
		});

	} catch (error) {
		next(error);
	}
}