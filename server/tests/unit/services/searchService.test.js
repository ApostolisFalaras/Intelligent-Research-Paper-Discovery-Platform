import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository function the fetches a paper by id
vi.mock("../../../src/repositories/searchRepository.js", () => ({
    searchPapersByTextQuery: vi.fn(),
}));

vi.mock("../../../src/repositories/userHistoryRepository.js", () => ({
    addToSearchHistory: vi.fn(),
}));


// Import after to replace the real function with the mock function
import { searchPapersByTextQuery } from "../../../src/repositories/searchRepository.js";
import { addToSearchHistory } from "../../../src/repositories/userHistoryRepository.js"; 
import { searchPapers } from "../../../src/services/searchService.js";


const mockResultsRows = [
    {
        id: "830837",
        openalex_id: "W3108235655",
        title: "Python Machine Learning: Machine Learning and Deep Learning with Python, scikit-learn, and TensorFlow",
        display_name: "Python Machine Learning: Machine Learning and Deep Learning with Python, scikit-learn, and TensorFlow",
        abstract: null,
        publication_year: 2019,
        cited_by_count: 262,
        fwci: "13.0741",
        primary_source_display_name: null,
        primary_topic_display_name: "Computational Physics and Python Applications",
        is_open_access: false,
        open_access_status: "closed",
        rank: "1",
        author_count: "1",
        authors_preview: [
            {"id": "A5110726461", "name": "Samuel Burns"}
        ]
    },
    {
        id: "830874",
        openalex_id: "W2909369566",
        title: "Python machine learning : machine learning and deep learning with Python, scikit-learn, and TensorFlow",
        display_name: "Python machine learning : machine learning and deep learning with Python, scikit-learn, and TensorFlow",
        abstract: "Python Machine Learning, Third Edition is a ...",
        publication_year: 2017,
        cited_by_count: 245,
        fwci: "8.3621",
        primary_source_display_name: null,
        primary_topic_display_name: "Computational Physics and Python Applications",
        is_open_access: false,
        open_access_status: "closed",
        rank: "1",
        author_count: "2",
        authors_preview: [
            { "id": "A5053156269", "name": "Sebastian Raschka" },
            { "id": "A5056930369", "name": "Vahid Mirjalili" }
        ]
    }
];

const defaultFilters = {
    fromYear: null,
    toYear: null,
    language: null,
    paperType: null,
    minCitations: null,
    topicId: null,
    authorName: null,
    isOpenAccess: true,
    sort: "relevance",
    hasContentPDF: null,
    isRetracted: false,
    page: 1,
    limit: 25,
    offset: 0
}

describe("searchPapers", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });
  
    // ----------- SUCCESSFUL PAPER RETRIEVAL ------------

    it("Maps fetched array of papers to array of formatted DTOs, with no filters, unauthenticated user", async () => {
        searchPapersByTextQuery.mockResolvedValue({
            totalResults: 2,
            papers: mockResultsRows
        });

        // Assuming no provided filters, since the effect would be the same with any of them
        // The focus of this test is the DTO formatting of the retrieved papers
        const results = await searchPapers(null, {query: "Machine Learning"});

        const expectedOutput = {
            totalResults: 2,
            
            papers: mockResultsRows.map((row) => ({
                id: row.openalex_id,
                internalId: row.id,
                title: row.title,
                displayName: row.display_name,
                abstract: row.abstract,
                publicationYear: row.publication_year,
                citedByCount: row.cited_by_count,
                fwci: Number(row.fwci),
                primarySource: row.primary_source_display_name,
                primaryTopic: row.primary_topic_display_name,
                isOpenAccess: row.is_open_access,
                openAccessStatus: row.open_access_status,
                rank: Number(row.rank),
                authorCount: Number(row.author_count),
                authorsPreview: row.authors_preview
            }))
        };

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query:"Machine Learning",
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        expect(addToSearchHistory).not.toHaveBeenCalled();
        expect(results).toEqual(expectedOutput);
    });


    it("Maps fetched array of papers to array of formatted DTOs, with no filters, authenticated user", async () => {
        searchPapersByTextQuery.mockResolvedValue({
            totalResults: 2,
            papers: mockResultsRows
        });

        addToSearchHistory.mockResolvedValue({id: 1, user_id: 1});

        // Assuming no provided filters, since the effect would be the same with any of them
        // The focus of this test is the DTO formatting of the retrieved papers
        const results = await searchPapers(1, {query: "Machine Learning"});

        const expectedOutput = {
            totalResults: 2,
            
            papers: mockResultsRows.map((row) => ({
                id: row.openalex_id,
                internalId: row.id,
                title: row.title,
                displayName: row.display_name,
                abstract: row.abstract,
                publicationYear: row.publication_year,
                citedByCount: row.cited_by_count,
                fwci: Number(row.fwci),
                primarySource: row.primary_source_display_name,
                primaryTopic: row.primary_topic_display_name,
                isOpenAccess: row.is_open_access,
                openAccessStatus: row.open_access_status,
                rank: Number(row.rank),
                authorCount: Number(row.author_count),
                authorsPreview: row.authors_preview
            }))
        };

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query:"Machine Learning"
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);

        const { page, limit, offset, ...searchHistoryFilters } = defaultFilters;
        expect(addToSearchHistory).toHaveBeenCalledWith(1, "Machine Learning", searchHistoryFilters, 2);
        expect(addToSearchHistory).toHaveBeenCalledTimes(1);
        expect(results).toEqual(expectedOutput);
    });

    // ----------- SUCCESSFUL RETRIEVAL OF EMPTY LIST WHEN NO PAPER MATCHES -----------

    it("Returns an empty array when query doesn't retrieve any papers, with no filters, unauthenticated user", async () => {
        searchPapersByTextQuery.mockResolvedValue({
            totalResults: 0,
            papers: []
        });

        const results = await searchPapers(null, {query: "unknown query"});

        // If the query doesn't match with any paper, the filters don't have an effect,
        // That's why no filters were used for simplicity
        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query: "unknown query", 
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        expect(addToSearchHistory).not.toHaveBeenCalled();
        expect(results).toEqual({
            totalResults: 0,
            papers: []
        });
    });

    it("Returns an empty array when query doesn't retrieve any papers, with no filters, authenticated user", async () => {
        searchPapersByTextQuery.mockResolvedValue({
            totalResults: 0,
            papers: []
        });
        addToSearchHistory.mockResolvedValue({id: 1, user_id: 1});

        const results = await searchPapers(1, {query: "unknown query"});

        // If the query doesn't match with any paper, the filters don't have an effect,
        // That's why no filters were used for simplicity
        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query: "unknown query", 
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        
        const { page, limit, offset, ...searchHistoryFilters } = defaultFilters;
        expect(addToSearchHistory).toHaveBeenCalledWith(1, "unknown query", searchHistoryFilters, 0);
        expect(addToSearchHistory).toHaveBeenCalledTimes(1);
        expect(results).toEqual({
            totalResults: 0,
            papers: []
        });
    });


    // ------------ DOESN'T FAIL WHEN INSERTION OF SEARCH HISTORY RECORD FAILS ------------
    it("Search doesn't fail when insertion of search history record fails", async () => {
        // Assuming no matching papers for simplicity
        searchPapersByTextQuery.mockResolvedValue({
            totalResults: 0,
            papers: []
        });

        addToSearchHistory.mockRejectedValue(new Error("Insertion of search history record failed"));

        const result = await searchPapers(1, {query: "unknown query"});

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query: "unknown query"
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);

        const { page, limit, offset, ...searchHistoryFilters } = defaultFilters;
        expect(addToSearchHistory).toHaveBeenCalledWith(1, "unknown query", searchHistoryFilters, 0);
        expect(addToSearchHistory).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            totalResults: 0,
            papers: []
        });
    });


    // ------------ FILTER VALIDATION AND NORMALIZATION -------------

    it("Validates & Normalizes filters before calling the searchPapers function", async () => {
        // Assuming no paper matches, since filter normalization & validation is tested
        searchPapersByTextQuery.mockResolvedValue({
            totalResults: 0,
            papers: []
        });

        // Checking all filters for test completeness
        const searchFilters = {
            query: "Unknown query",
            fromYear: "2014",
            toYear: "2018",
            language: "Greek",
            paperType: "article",
            minCitations: "100",
            topicId: "T10102",
            authorName: "John Doe",
            isOpenAccess: "true",
            hasContentPDF: "true",
            isRetracted: "false",
            sort: "impact",
            page: "2",
            limit: "10",
        };

        const results = await searchPapers(null, searchFilters);

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            query: "Unknown query",
            fromYear: 2014,
            toYear: 2018,
            language: "Greek",
            paperType: "article",
            minCitations: 100,
            topicId: "T10102",
            authorName: "John Doe",
            isOpenAccess: true,
            hasContentPDF: true,
            isRetracted: false,
            sort: "impact",
            page: 2,
            limit: 10,
            offset: 10
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        expect(results).toEqual({
            totalResults: 0,
            papers: []
        });

    });

    // ------------ QUERY TRIMMING CHECK -----------

    it("Trims the query before calling the repository function", async () => {
        // Since the trimming of input is checked here, 
        // we assume a query with no retrieved results and no filters applied for simplicity
        searchPapersByTextQuery.mockResolvedValue({
            totalResults: 0,
            papers: []
        });

        const results = await searchPapers(null, {query: "  unknown query   "});

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            query:"unknown query", 
            fromYear: null,
            toYear: null,
            language: null,
            paperType: null,
            minCitations: null,
            topicId: null,
            authorName: null,
            isOpenAccess: true,
            sort: "relevance",
            hasContentPDF: null,
            isRetracted: false,
            page: 1,
            limit: 25,
            offset: 0
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        expect(results).toEqual({
            totalResults: 0,
            papers: []
        });
    });

    // ------------- BAD REQUEST CASES -> 400 --------------

    it("Throws a 400 AppError when input q is missing", async () => {
        // When the query is missing, we don't care about the rest of the filters
        await expect(searchPapers(null, {query: ""})).rejects.toThrow("Search query is required");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });


    it("Throws a 400 AppError when input q is whitespaces", async () => {
        // When the query is missing, we don't care about the rest of the filters
        await expect(searchPapers(null, {query: "    "})).rejects.toThrow("Search query is required");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    // ----------- PAGINATION UNIT TESTS ------------

    it("Throws a 400 AppError when the 'page' filter is non-positive", async () => {
        // Request contains invalid page number
        await expect(searchPapers(null, {query: "Machine Learning", page: "0"}))
        .rejects
        .toThrow("'page' must be greater than or equal to 1");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when the 'limit' filter is non-positive", async () => {
        // Request contains invalid limit number
        await expect(searchPapers(null, {query: "Machine Learning", limit: "0"}))
        .rejects
        .toThrow("'limit' must be between 1 and 100");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    // ------------ FILTER TESTS BASED ON THEIR DATA TYPES ---------------
    
    // Similar tests can be generated for:
    // 1) language not having an accepted value
    // 2) sort not having an available sorting type
    // 3) paperType not having one of the available paper types in the database
    it("Throws a 400 AppError when fromYear is greater than toYear", async () => {
        await expect(searchPapers(null, {query: "Machine Learning", fromYear: "2015", toYear: "2010"}))
        .rejects
        .toThrow("'fromYear' cannot be greater than 'toYear'");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when a string filter is invalid", async () => {
        await expect(searchPapers(null, {query: "Machine Learning", topicId: 10102 }))
        .rejects
        .toThrow("'topicId' must be a string");
        
        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when an integer filter is invalid", async () => {
        await expect(searchPapers(null, {query: "Machine Learning", minCitations: "One Hundred"}))
        .rejects
        .toThrow("'minCitations' must be an integer");
        
        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when a boolean filter is invalid", async () => {
        await expect(searchPapers(null, {query: "Machine Learning", isOpenAccess: "yes"}))
        .rejects
        .toThrow("'isOpenAccess' must be either true or false");
        
        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });


    // ------------ DATABASE ERROR --------------

    it("Propagates repository error", async () => {
        searchPapersByTextQuery.mockRejectedValue(new Error("Database query failed."));

        await expect(searchPapers(null, {query: "Machine Learning"})).rejects.toThrow("Database query failed.");
    
        // A database error produces the same output, regardless of any filters being applied
        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            query: "Machine Learning",
            fromYear: null,
            toYear: null,
            language: null,
            paperType: null,
            minCitations: null,
            topicId: null,
            authorName: null,
            isOpenAccess: true,
            sort: "relevance",
            hasContentPDF: null,
            isRetracted: false,
            page: 1,
            limit: 25,
            offset: 0
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
    });
});