import {
	fetchPopularRecommendations,
	fetchContentRecommendations,
	fetchUserRecommendations,
	fetchTopicRecommendations,
	countContentRecommendations,
	countUserRecommendations,
	countTopicRecommendations
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

		const sections = [{ type: "popular", header: "Popular papers", papers: paperRecomDTO(popularPapers) }];
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

			sections.push({ type: "popular", header: "Popular papers", papers: paperRecomDTO(popularPapers) });
			
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
				sections.push({ type: "popular", header: "Popular papers", papers: paperRecomDTO(popularPapers) });
			}
			else if (numInteractions < 3) {
				sections.push({ type: "activity", header: "Because you viewed", papers: paperRecomDTO(contentBased) });
				sections.push({ type: "popular", header: "Popular papers", papers: paperRecomDTO(popularPapers)});
			}
			else if (numInteractions < 10) {
				sections.push({ type: "activity", header: "Based on your interests", papers: paperRecomDTO(contentBased) });
				sections.push({ type: "topics", header: "Explore your research topics", papers: paperRecomDTO(topicBased) });
				sections.push({ type: "popular", header: "Popular papers", papers: paperRecomDTO(popularPapers) });
			}
			else {
				sections.push({ type: "activity", header: "Based on your interests", papers: paperRecomDTO(contentBased) });
				sections.push({ 
					type: "similar",
					header: "Researchers with similar interests also viewed", 
					papers: paperRecomDTO(userBased) 
				});
				sections.push({ type: "topics", header: "Explore your research topics", papers: paperRecomDTO(topicBased) });
			}

		} 

		return {
			authenticated: true,
			sections
		}
	}
}

const MAX_RECOMMENDATIONS = 100;

// Retrieves popular recommendations for an unauthenticated user
export async function getRecommendationsPage(userId, type, page, limit) {
	const { parsedPage, parsedLimit } = validatePagination(page, limit);

	const offset = (parsedPage - 1) * parsedLimit;

	// In case user is unauthenticated (only popular recommendations)
	if (!userId) {
		const availableTypes = ["popular"];
		const totalPapers = MAX_RECOMMENDATIONS;
		const papers = await fetchPopularRecommendations(parsedLimit, offset);
		
		return {
			availableTypes,
			type: "popular",
			page: parsedPage,
			limit: parsedLimit,
			totalPapers: Number(totalPapers),
			papers: paperRecomDTO(papers)
		}
	}

	const parsedUserId = parseUserId(userId);

	// Using the user's total number of interactions, similarly to the home page
	// but for the recommendation option buttons in the recommendations page
	const count = await fetchUserInteractionsCount(parsedUserId);
	const numInteractions = Number(count.num_interactions);

	let availableTypes;

	if (numInteractions === 0) { 
		availableTypes = ["popular"]; 
	}
	else if (numInteractions < 3) { 
		availableTypes = ["activity", "popular"]; 
	}
	else if (numInteractions < 10) { 
		availableTypes = ["activity", "topics", "popular"]; 
	}
	else { 
		availableTypes = ["activity", "similar", "topics"]; 
	}

	const selectedType = availableTypes.includes(type)
							? type
							: availableTypes[0];

	
	// Fetch the papers of the currently selected recommendation type
	let papers;
	let actualTotal;

	switch(selectedType) {
		case "popular":
			actualTotal = MAX_RECOMMENDATIONS;
			papers = await fetchPopularRecommendations(parsedLimit, offset);
			break;

		case "activity":
			[papers, actualTotal] = await Promise.all([
				fetchContentRecommendations(parsedUserId, parsedLimit, offset),
				countContentRecommendations(parsedUserId)
			]);
			break;

		case "similar":
			[papers, actualTotal] = await Promise.all([
				fetchUserRecommendations(parsedUserId, parsedLimit, offset),
				countUserRecommendations(parsedUserId)
			]);
			break;

		case "topics":
			[papers, actualTotal] = await Promise.all([
				fetchTopicRecommendations(parsedUserId, parsedLimit, offset),
				countTopicRecommendations(parsedUserId)
			]);
			break;
	}

	const totalPapers = Math.min(actualTotal, MAX_RECOMMENDATIONS);
	

	return {
		availableTypes,
		type: selectedType,
		page: parsedPage,
		limit: parsedLimit,
		totalPapers: Number(totalPapers),
		papers: paperRecomDTO(papers)
	};
}