import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository function the fetches a paper by id
vi.mock("./../../src/repositories/searchRepository.js", () => ({
    searchPapersByTextQuery: vi.fn(),
}));

// Import after to replace the real function with the mock function
import { searchPapersByTextQuery } from "./../../src/repositories/searchRepository.js";
import { searchPapers } from "./../../src/services/searchService.js";

describe("searchPapers", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Maps fetched array of papers to array of formatted DTOs (independent of filters)", async () => {
        searchPapersByTextQuery.mockResolvedValue([
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
        ]);

        // Assuming no provided filters, since the effect would be the same with any of them
        // The focus of this test is the DTO formatting of the retrieved papers
        const results = await searchPapers({query: "Machine Learning"});

        const expectedOutput = [
            {
                id: "W3108235655",
                internalId: "830837",
                title: "Python Machine Learning: Machine Learning and Deep Learning with Python, scikit-learn, and TensorFlow",
                displayName: "Python Machine Learning: Machine Learning and Deep Learning with Python, scikit-learn, and TensorFlow",
                abstract: null,
                publicationYear: 2019,
                citedByCount: 262,
                fwci: 13.0741,
                primarySource: null,
                primaryTopic: "Computational Physics and Python Applications",
                isOpenAccess: false,
                openAccessStatus: "closed",
                rank: 1,
                authorCount: 1,
                authorsPreview: [
                    { "id": "A5110726461", "name": "Samuel Burns" }
                ]
            },
            {
                id: "W2909369566",
                internalId: "830874",
                title: "Python machine learning : machine learning and deep learning with Python, scikit-learn, and TensorFlow",
                displayName: "Python machine learning : machine learning and deep learning with Python, scikit-learn, and TensorFlow",
                abstract: "Python Machine Learning, Third Edition is a ...",
                publicationYear: 2017,
                citedByCount: 245,
                fwci: 8.3621,
                primarySource: null,
                primaryTopic: "Computational Physics and Python Applications",
                isOpenAccess: false,
                openAccessStatus: "closed",
                rank: 1,
                authorCount: 2,
                authorsPreview: [
                    { "id": "A5053156269", "name": "Sebastian Raschka" },
                    { "id": "A5056930369", "name": "Vahid Mirjalili" }
                ]
            }
        ];

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            query:"Machine Learning", 
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
        expect(results).toEqual(expectedOutput);
    });


    it("Returns an empty array when query doesn't retrieve any papers", async () => {
        searchPapersByTextQuery.mockResolvedValue([]);

        const results = await searchPapers({query: "unknown query"});

        // If the query doesn't match with any paper, the filters don't have an effect,
        // That's why no filters were used for simplicity
        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            query: "unknown query", 
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
        expect(results).toEqual([]);
    });

    it("Validates & Normalizes filters before calling the searchPapers function", async () => {
        // Assuming no paper matches, since filter normalization & validation is tested
        searchPapersByTextQuery.mockResolvedValue([]);

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

        const results = await searchPapers(searchFilters);

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
        expect(results).toEqual([]);

    });

    it("Trims the query before calling the repository function", async () => {
        // Since the trimming of input is checked here, 
        // we assume a query with no retrieved results and no filters applied for simplicity
        searchPapersByTextQuery.mockResolvedValue([]);

        const results = await searchPapers({query: "  unknown query   "});

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
        expect(results).toEqual([]);
    });


    it("Throws a 400 AppError when input q is missing", async () => {
        // When the query is missing, we don't care about the rest of the filters
        await expect(searchPapers({query: ""})).rejects.toThrow("Search query is required");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });


    it("Throws a 400 AppError when input q is whitespaces", async () => {
        // When the query is missing, we don't care about the rest of the filters
        await expect(searchPapers({query: "    "})).rejects.toThrow("Search query is required");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    // ----------- PAGINATION UNIT TESTS ------------

    it("Throws a 400 AppError when the 'page' filter is non-positive", async () => {
        // Request contains invalid page number
        await expect(searchPapers({query: "Machine Learning", page: "0"}))
        .rejects
        .toThrow("'page' must be greater than or equal to 1");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when the 'limit' filter is non-positive", async () => {
        // Request contains invalid limit number
        await expect(searchPapers({query: "Machine Learning", limit: "0"}))
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
        await expect(searchPapers({query: "Machine Learning", fromYear: "2015", toYear: "2010"}))
        .rejects
        .toThrow("'fromYear' cannot be greater than 'toYear'");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when a string filter is invalid", async () => {
        await expect(searchPapers({query: "Machine Learning", topicId: 10102 }))
        .rejects
        .toThrow("'topicId' must be a string");
        
        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when an integer filter is invalid", async () => {
        await expect(searchPapers({query: "Machine Learning", minCitations: "One Hundred"}))
        .rejects
        .toThrow("'minCitations' must be an integer");
        
        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when a boolean filter is invalid", async () => {
        await expect(searchPapers({query: "Machine Learning", isOpenAccess: "yes"}))
        .rejects
        .toThrow("'isOpenAccess' must be either true or false");
        
        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });


    // ------------ DATABASE ERROR --------------

    it("Propagates repository error", async () => {
        searchPapersByTextQuery.mockRejectedValue(new Error("Database query failed."));

        await expect(searchPapers({query: "Machine Learning"})).rejects.toThrow("Database query failed.");
    
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