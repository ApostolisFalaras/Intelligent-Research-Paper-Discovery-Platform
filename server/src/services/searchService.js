import { searchPapersByTextQuery } from "./../repositories/searchRepository.js";
import { AppError } from "./../utils/AppError.js";
import { parseStringFilter, parseIntegerFilter, parseBooleanFilter } from "./../utils/parseFilters.js";
import { ALLOWED_SORT_TYPES, ALLOWED_LANGUAGES, ALLOWED_PAPER_TYPES } from "./../utils/searchConstants.js";

export async function searchPapers(queryParams) {

    // Validate search bar's input query & filters
    const filters = validateSearchFilters(queryParams)
    
    const papers = await searchPapersByTextQuery(filters);
    
    // Papers Data Transfer Object (DTO)
    const papersDTO = [];
    
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

    return papersDTO;
}

// Validates each search parameter only if it exists. If it doesn't exist, move to the next one.
function validateSearchFilters(searchFilters) {
    // Main search query
    const query = parseStringFilter(searchFilters.query, "query");

    if (!query)
        throw new AppError("Search query is required", 400);
    
    // Pagination filters
    const page = parseIntegerFilter(searchFilters.page, "page") ?? 1;
    const limit = parseIntegerFilter(searchFilters.limit, "limit") ?? 25;

    if (page < 1)
        throw new AppError("'page' must be greater than or equal to 1", 400);

    if (limit < 1 || limit > 100)
        throw new AppError("'limit' must be between 1 and 100", 400);

    // publication Year range filter
    const fromYear = parseIntegerFilter(searchFilters.fromYear, "fromYear");
    const toYear = parseIntegerFilter(searchFilters.toYear, "toYear");

    if (fromYear !== null && fromYear < 1800)
        throw new AppError("'fromYear' must be greater than or equal to 1800", 400);

    if (toYear !== null && toYear > 2026)
        throw new AppError("'toYear' must be less than or equal to 2026", 400);

    if (fromYear !== null && toYear !== null && fromYear > toYear)
        throw new AppError("'fromYear' cannot be greater than 'toYear'", 400);

    // language filter
    const language = parseStringFilter(searchFilters.language, "language");
    if (language !== null && !ALLOWED_LANGUAGES.includes(language))
        throw new AppError("Invalid 'language' parameter", 400);

    // paper type filter
    const paperType = parseStringFilter(searchFilters.paperType, "paperType");
    if (paperType !== null && !ALLOWED_PAPER_TYPES.includes(paperType))
        throw new AppError("Invalid 'paperType' parameter", 400);


    // minimum Citations filter
    const minCitations = parseIntegerFilter(searchFilters.minCitations, "minCitations");
    if (minCitations !== null && minCitations < 0) 
        throw new AppError("'minCitations' cannot be negative", 400);

    // Topic filter
    const topicId = parseStringFilter(searchFilters.topicId, "topicId");
    if (topicId !== null && !topicId.startsWith("T"))
        throw new AppError("'topicId' has invalid ID format", 400);

    // Author filter
    const authorName = parseStringFilter(searchFilters.authorName, "authorId");

    // Open-Access filter
    const isOpenAccess = parseBooleanFilter(searchFilters.isOpenAccess, "isOpenAccess") ?? true; 
    
    // Sorting filter
    const sort = searchFilters.sort ?? "relevance";
    if (!ALLOWED_SORT_TYPES.includes(sort))
        throw new AppError("Invalid 'sort' paramater", 400);

    // has-Pdf filter
    const hasContentPDF = parseBooleanFilter(searchFilters.hasContentPDF, "hasContentPDF");

    // default is-retracted filter
    const isRetracted = parseBooleanFilter(searchFilters.isRetracted, "isRetracted") ?? false;

    return {
        query,
        fromYear,
        toYear,
        language,
        paperType,
        minCitations,
        topicId,
        authorName,
        isOpenAccess,
        hasContentPDF,
        isRetracted,
        sort,
        page,
        limit,  // Acts like papers/page filter
        offset: (page - 1) * limit
    }
}
