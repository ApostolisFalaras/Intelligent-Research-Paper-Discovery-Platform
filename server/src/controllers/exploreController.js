import { getExploreContent, getExploreTopic } from "./../services/exploreService.js";


// Fetches generic topic exploration preview papers
export async function getExploreContentController(req, res, next) {
	try {
		const topicSections = await getExploreContent();

		return res.status(200).json({
			status: "success",
			data: topicSections
		});

	} catch (error) {
		next(error);
	}
}

// Fetches papers for a particular exploration topic
export async function getExploreTopicController(req, res, next) {
	try {
		const topicInfo = await getExploreTopic(
			req.params.id, 
			req.query.page, 
			req.query.limit, 
			req.query.sort ?? "citations"
		);

		return res.status(200).json({
			status: "success",
			data: topicInfo
		});
	} catch (error) {
		next(error);
	}
}