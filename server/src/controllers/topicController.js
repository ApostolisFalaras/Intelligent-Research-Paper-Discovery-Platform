import { getTopicById } from "./../services/topicService.js";
import { AppError } from "./../utils/AppError.js";


// Retrieves a topic and its information
export async function getTopicByIdController(req, res, next) {
	try {
		const topic = await getTopicById(req.params.id);

		res.status(200).json({
			status: "success",
			data: topic
		});
	} catch(error) {
		next(error);
	}
}