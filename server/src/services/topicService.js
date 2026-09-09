import { fetchAllTopics } from "./../repositories/topicRepository.js";
import { AppError } from "./../utils/AppError.js";

export async function getAllTopics() {
	const topics = await fetchAllTopics();

	if (!Array.isArray(topics)) {
		throw new AppError("Invalid repository result", 500);
	}

	return topics.map((topic) => ({
		topicId: topic.primary_topic_openalex_id,
		topicName: topic.primary_topic_display_name,
		fieldId: topic.primary_field_openalex_id,
		fieldName: topic.primary_field_display_name
	}));
}