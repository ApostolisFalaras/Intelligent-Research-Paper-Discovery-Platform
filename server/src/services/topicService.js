import { fetchTopicById, fetchTopicPapers } from "./../repositories/topicRepository.js";
import { parseString, parseInteger } from "./../utils/parseData.js";
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

	const top5Papers = await fetchTopicPapers(topic.id, 5, 0);

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
		updatedAt: topic.openalex_updated_at,

		topPapers: top5Papers.map(paper => ({
			id: paper.openalex_id,
			internalId: paper.id,
			title: paper.title,
			displayName: paper.display_name,
			abstract: paper.abstract,
			publicationYear: paper.publication_year,
			citedByCount: paper.cited_by_count,
			fwci: Number(paper.fwci),
			primarySource: paper.primary_source_display_name,
			primaryTopic: paper.primary_topic_display_name,
			isOpenAccess: paper.is_open_access,
			openAccessStatus: paper.open_access_status,
			authorCount: Number(paper.author_count),
			authorsPreview: paper.authors_preview,
		}))
	};
}

// User fetches papers associated with a topic
export async function getTopicPapers(id, pagination) {
	// Validate topic id
	const parsedId = parseString(id, "topic id");

	// Validate topic id format: "T" followed by digits
	if (!parsedId || !/^T\d+$/.test(parsedId)) {
		throw new AppError("Invalid topic Id", 400);
	}
	
	// Pagination filters validation
	const page = parseInteger(pagination.page, "page") ?? 1;
	const limit = parseInteger(pagination.limit, "limit") ?? 10;

	if (page < 1)
		throw new AppError("'page' must be greater than or equal to 1", 400);

	if (limit < 1 || limit > 100)
		throw new AppError("'limit' must be between 1 and 100", 400);

	const offset = (page - 1) * limit;


	const topic = await fetchTopicById(parsedId);

	// Validate if the topic exists
    if (!topic)
        throw new AppError("Topic not found", 404);

	const papers = await fetchTopicPapers(topic.id, limit, offset);

	return papers.map(paper => ({
		id: paper.openalex_id,
		internalId: paper.id,
		title: paper.title,
		displayName: paper.display_name,
		abstract: paper.abstract,
		publicationYear: paper.publication_year,
		citedByCount: paper.cited_by_count,
		fwci: Number(paper.fwci),
		primarySource: paper.primary_source_display_name,
		primaryTopic: paper.primary_topic_display_name,
		isOpenAccess: paper.is_open_access,
		openAccessStatus: paper.open_access_status,
		authorCount: Number(paper.author_count),
		authorsPreview: paper.authors_preview,
	}));
}