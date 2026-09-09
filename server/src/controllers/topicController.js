import { getTopicById, getTopicPapers, getAllTopics } from "./../services/topicService.js";
import { AppError } from "./../utils/AppError.js";


// The app fetches all topics for the "Topic" dropdown search filter
export async function getAllTopicsController(req, res, next) {
	try {
		const topics = await getAllTopics();

		res.status(200).json({
			status: "success",
			data: topics
		});
	} catch(error) {
		next(error);
	}
}