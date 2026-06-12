import { getTopicById, getTopicPapers } from "./../services/topicService.js";
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

// Retrieves papars associated with a particular topic
export async function getTopicPapersController(req, res, next) {
	try {
		const papers = await getTopicPapers(req.params.id, req.query);

		res.status(200).json({
			status: "success",
			data: papers
		});
	} catch(error) {
		next(error);
	}
}