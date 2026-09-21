import {
	fetchRandomTopics,
	fetchRandomPapersByTopic,
	fetchExplorePapersByTopic,
	fetchExploreTopicPaperCount,
	fetchExploreTopicById
} from "./../repositories/exploreRepository.js";
import { parseInteger, parseString } from "./../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";


// Data Transfer Object (DTO) format for papers during exploration
function paperExploreDTO(papers) {
	return papers.map((paper) => ({
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

// Retrieves preview of exploration info about a set of random papers
export async function getExploreContent() {
	const topics = await fetchRandomTopics(10);

	const sections = await Promise.all(
			topics.map(async (topic) => {
				const papers = await fetchRandomPapersByTopic(topic.openalex_id, 10);
			

			return {
				topic: {
					id: topic.openalex_id,
					internalId: topic.id,
					displayName: topic.topic_display_name,
					fieldDisplayName: topic.field_display_name,
					description: topic.topic_description,
					worksCount: Number(topic.works_count),
					citedByCount: Number(topic.cited_by_count)
				},
				
				papers: paperExploreDTO(papers)
			};
		})
	);

	return sections;
}

// Explores a particular topic
export async function getExploreTopic(topicId, page = 1, limit = 25, sort = "citations") {
	// Validate topic Id
	const parsedTopicId = parseString(topicId, "topic id");

	if (!/^T\d+$/.test(parsedTopicId)) {
		throw new AppError("Invalid topic id", 400);
	}

	// Validate pagination 
	const parsedPage = parseInteger(page, "page");
	const parsedLimit = parseInteger(limit, "limit");

	if (parsedPage < 1) {
		throw new AppError("'page' must be greater than or equal to 1", 400);
	}

	if (parsedLimit < 1 || parsedLimit > 100) {
		throw new AppError("'limit' must be between 1 and 100", 400);
	}

	// Validate sorting type
	const allowedSorts = new Set(["citations", "recent", "popular"]);
	if (!allowedSorts.has(sort)) {
		throw new AppError("Invalid explore sort", 400);
	}

	const offset = (parsedPage - 1) * parsedLimit;
	
	const [topic, papers, totalResults] = await Promise.all([
		fetchExploreTopicById(parsedTopicId),
		fetchExplorePapersByTopic(parsedTopicId, parsedLimit, offset, sort),
		fetchExploreTopicPaperCount(parsedTopicId)
	]);

	if (!topic) {
		throw new AppError("Topic not found", 404);
	}

	return {
		topic: {
			id: topic.openalex_id,
			displayName: topic.topic_display_name,
			fieldDisplayName: topic.field_display_name
		},
		totalResults,
		page: parsedPage,
		limit: parsedLimit,
		papers: paperExploreDTO(papers)
	};
}