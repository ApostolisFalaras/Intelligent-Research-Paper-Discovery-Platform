import { fetchTopicById } from "./../repositories/topicRepository.js";
import { parseString } from "./../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";

// User fetches a topic with a particular Id 
export async function getTopicById(id) {
	// Validate topic id
	const parsedId = parseString(id, "topic id");

	// Validate topic id format: "T" followed by digits
	if (!parsedId || !/^T\d+$/.test(parsedId)) {
		throw new AppError("Invalid topic Id", 400);
	}
	
	const topic = await fetchTopicById(parsedId);

	// Validate if the topic exists
    if (!topic)
        throw new AppError("Topic not found", 404);

	return {
		id: topic.openalex_id,
		internalId: topic.id,
		displayName: topic.topic_display_name,
		description: topic.topic_description,
		keywords: topic.topic_keywords,
		wikipediaURL: topic.topic_wikipedia_url,
		domain: {
			id: topic.domain_openalex_id,
			name: topic.domain_display_name
		},
		field: {
			id: topic.field_openalex_id,
			name: topic.field_display_name
		},
		subfield: {
			id: topic.subfield_openalex_id,
			name: topic.subfield_display_name
		},
		worksCount: topic.works_count,
		citedByCount: topic.cited_by_count,
		worksApiURL: topic.works_api_url,
		createdAt: topic.openalex_created_at,
		updatedAt: topic.openalex_updated_at
	};
}