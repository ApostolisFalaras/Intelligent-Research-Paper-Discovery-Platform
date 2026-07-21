import {
	fetchPopularRecommendations,
	fetchContentRecommendations,
	fetchUserRecommendations,
	fetchTopicRecommendations
} from "./../repositories/recommendationRepository.js";
import { fetchUserInteractionsCount } from "./../repositories/recommendationProfileRepository.js";
import { parseInteger, parseUserId } from "./../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";


// Helper function for repeated instances of pagination filters validation
function validatePagination(page, limit) {
	const parsedPage = parseInteger(page, "page");

	if (parsedPage < 1)
		throw new AppError("'page' must be greater than or equal to 1", 400);

	const parsedLimit = parseInteger(limit, "limit");

	if (parsedLimit < 1 || parsedLimit > 100)
		throw new AppError("'limit' must be between 1 and 100", 400);

	return {
		parsedPage, 
		parsedLimit
	};
}

function paperRecomDTO(papers) {
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
        rank: Number(paper.rank),
        authorCount: Number(paper.author_count),
        authorsPreview: paper.authors_preview,
    }));
}

// It fetches a preview of each type of recommendation
export async function getHomeRecommendations(userId) {
	// If the user is unauthenticated, fetch the top 10 most popular papers 
	// in the whole database
	if (!userId) {
		const popularPapers = await fetchPopularRecommendations(10);

		const sections = [{ header: "Popular papers", papers: paperRecomDTO(popularPapers) }];
		return {
			authenticated: false,
			sections
		};
	}
	else {
		// If the user is authenticated, fetch the top 5 papers from each of the 3
		// categories: content-based, user-based, & topic-based
		const parsedUserId = parseUserId(userId);

		const count = await fetchUserInteractionsCount(parsedUserId);
		const numInteractions = count.num_interactions;

		const sections = [];

		// Cold-start recommendations with popular papers
		if (numInteractions === 0) {
			const popularPapers = await fetchPopularRecommendations(10);

			sections.push({ header: "Popular papers", papers: paperRecomDTO(popularPapers) });
			
		}
		else {
			const [
				contentBased,
				userBased,
				topicBased,
				popularPapers
			] = await Promise.all([
				fetchContentRecommendations(parsedUserId, 5),
				fetchUserRecommendations(parsedUserId, 5),
				fetchTopicRecommendations(parsedUserId, 5),
				fetchPopularRecommendations(5)
			]);

			const hasRecommendations = contentBased.length > 0 || userBased.length > 0 || topicBased.length > 0;

			if (!hasRecommendations) {
				sections.push({ header: "Popular papers", papers: paperRecomDTO(popularPapers) });
			}
			else if (numInteractions < 3) {
				sections.push({ header: "Because you viewed", papers: paperRecomDTO(contentBased) });
				sections.push({ header: "Popular papers", papers: paperRecomDTO(popularPapers)});
			}
			else if (numInteractions < 10) {
				sections.push({ header: "Based on your interests", papers: paperRecomDTO(contentBased) });
				sections.push({ header: "Explore your research topics", papers: paperRecomDTO(topicBased) });
				sections.push({ header: "Popular papers", papers: paperRecomDTO(popularPapers) });
			}
			else {
				sections.push({ header: "Based on your interests", papers: paperRecomDTO(contentBased) });
				sections.push({ 
					header: "Researchers with similar interests also viewed", 
					papers: paperRecomDTO(userBased) 
				});
				sections.push({ header: "Explore your research topics", papers: paperRecomDTO(topicBased) });
			}

		} 

		return {
			authenticated: true,
			sections
		}
	}
}

// Retrieves popular recommendations for an unauthenticated user
export async function getPopularRecommendations(page, limit) {
	// Validate pagination filters
	const { parsedPage, parsedLimit } = validatePagination(page, limit);

	const offset = (parsedPage - 1) * parsedLimit;
	return fetchPopularRecommendations(parsedLimit, offset);
}


// Retrieves content-based recommendations for a user
export async function getContentRecommendations(userId, page, limit) {
	const parsedUserId = parseUserId(userId);

	// Validate pagination filters
	const { parsedPage, parsedLimit } = validatePagination(page, limit);

	const offset = (parsedPage - 1) * parsedLimit;
	return fetchContentRecommendations(parsedUserId, parsedLimit, offset);
}

// Retrieves user-based recommendations for a user
export async function getUserRecommendations(userId, page, limit) {
	const parsedUserId = parseUserId(userId);

	// Validate pagination filters
	const { parsedPage, parsedLimit } = validatePagination(page, limit);

	const offset = (parsedPage - 1) * parsedLimit;
	return fetchUserRecommendations(parsedUserId, parsedLimit, offset);
}

// Retrieves topic-based recommendations for a user
export async function getTopicRecommendations(userId, page, limit) {
	const parsedUserId = parseUserId(userId);

	// Validate pagination filters
	const { parsedPage, parsedLimit } = validatePagination(page, limit);

	const offset = (parsedPage - 1) * parsedLimit;
	return fetchTopicRecommendations(parsedUserId, parsedLimit, offset);
}
