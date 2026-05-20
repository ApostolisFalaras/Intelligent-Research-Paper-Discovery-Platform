import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the search repository function that queries the PostgreSQL DB
vi.mock("./../../src/repositories/searchRepository.js", () => ({
    searchPapersByTextQuery: vi.fn()
}));

vi.mock("./../../src/repositories/userHistoryRepository.js", () => ({
    addToSearchHistory: vi.fn()
}));

// Middleware has to be mocked to authenticate the only existing user in the current tests
let mockAuthenticatedUser = {id: 1};

vi.mock("./../../src/middlewares/authMiddleware.js", async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        optionalAuthMiddleware: (req, res, next) => {
            req.user = mockAuthenticatedUser;
            return next();
        }
    }
});

// Import after to replace the real function with the mock function
import { searchPapersByTextQuery } from "../../src/repositories/searchRepository.js";
import { addToSearchHistory } from "../../src/repositories/userHistoryRepository.js";
import { optionalAuthMiddleware } from "../../src/middlewares/authMiddleware.js";
import app from "../../src/app.js";


const mockResultsRows_1 = [
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

const mockResultsRows_2 = [
    {
        id: "864364",
        openalex_id: "W3215633082",
        title: "Transformational machine learning: Learning how to learn from many related scientific problems",
        display_name: "Transformational machine learning: Learning how to learn from many related scientific problems",
        abstract: "Almost all machine learning (ML) is based on representing examples using intrinsic features...",
        publication_year: 2021,
        cited_by_count: 35,
        fwci: "4.0595",
        primary_source_display_name: "Proceedings of the National Academy of Sciences",
        primary_topic_display_name: "Machine Learning and Data Classification",
        is_open_access: true,
        open_access_status: "hybrid",
        rank: "0.9999973",
        author_count: "7",
        authors_preview: [
            {"id": "A5028083196", "name": "Iván Olier"},
            {"id": "A5084132314", "name": "Oghenejokpeme I. Orhobor"}
        ]
    },
    {
        id: "838182",
        openalex_id: "W4400556081",
        title: "Hybrid Quantum-Classical Machine Learning Models: Powering the Future of AI",
        display_name: "Hybrid Quantum-Classical Machine Learning Models: Powering the Future of AI",
        abstract: "The burgeoning field of machine learning has transformed numerous sectors, ...",
        publication_year: 2023,
        cited_by_count: 30,
        fwci: "5.2198",
        primary_source_display_name: "Journal of Science & Technology",
        primary_topic_display_name: "Quantum Computing Algorithms and Architecture",
        is_open_access: true,
        open_access_status: "diamond",
        rank: "0.99999547",
        author_count: "1",
        authors_preview: [
            { "id": "A5093749371", "name": "Mohan Raja Pulicharla" },
        ]
    },
];

// Aggregating default filters
const defaultFilters = {
    fromYear: null,
    toYear: null,
    language: null,
    paperType: null,
    minCitations: null,
    topicId: null,
    authorName: null,
    isOpenAccess: true,
    hasContentPDF: null,
    isRetracted: false,
    sort: "relevance",
    page: 1,
    limit: 25,
    offset: 0
};

describe("GET /api/search/?q=<search-query>", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ------------ SKIPPING USER AND DB ERRORS TESTS, SINCE THEY'RE THE SAME IN
    // ------------ THE (UN-)AUTHENITCATED USER CASE AND ARE PRESENT IN THE OTHER TEST FILE

    
    // ------------ TESTS WITH DEFAULT FILTERS --------------

    it("Returns 200 and the found search results with default filters", async () => {
        searchPapersByTextQuery.mockResolvedValue(mockResultsRows_1);

        const expectedResponseData = mockResultsRows_1.map((row) => ({
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
        }));

        const response = await request(app).get("/api/search/").query({query: "Machine Learning"}).expect(200);

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query: "Machine Learning"
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);

        const { page, limit, offset, ...searchHistoryFilters } = defaultFilters;
        expect(addToSearchHistory).toHaveBeenCalledWith(1, "Machine Learning", searchHistoryFilters, 2);
        expect(addToSearchHistory).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedResponseData);
    });


    it("Returns 200 but there were no search results with default filters", async () => {
        searchPapersByTextQuery.mockResolvedValue([]);

        const response = await request(app).get("/api/search/").query({query: "Unknown query"}).expect(200);

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query: "Unknown query"
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);

        const { page, limit, offset, ...searchHistoryFilters } = defaultFilters;
        expect(addToSearchHistory).toHaveBeenCalledWith(1, "Unknown query", searchHistoryFilters, 0);
        expect(addToSearchHistory).toHaveBeenCalledTimes(1);
        
        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual([]);
    });

    // -------------- TEST WITH COMBINATIONS OF FILTERS -------------
    
    it("Returns 200 and the found papers with filters", async () => {
        searchPapersByTextQuery.mockResolvedValue(mockResultsRows_2);

        const expectedResponseData = mockResultsRows_2.map((row) => ({
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
        }));

        // Every other filter combination works similarly
        const response = await request(app).get("/api/search/").query({
            query: "Machine Learning",
            fromYear: 2015,
            toYear: 2025,
            paperType: "article",
            page: 2,
            limit: 2,
        })
        .expect(200);

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query: "Machine Learning",
            fromYear: 2015,
            toYear: 2025,
            paperType: "article",
            page: 2,
            limit: 2,
            offset: 2
        });

        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);

        const { page, limit, offset, ...searchHistoryFilters } = defaultFilters;
        const searchFilters = {
            ...searchHistoryFilters, 
            fromYear: 2015,
            toYear: 2025,
            paperType: "article"
        };
        expect(addToSearchHistory).toHaveBeenCalledWith(1, "Machine Learning", searchFilters, 2);
        expect(addToSearchHistory).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedResponseData);
    });

    
    it("Returns 200 even when saving history fails", async () => {
        searchPapersByTextQuery.mockResolvedValue(mockResultsRows_1);
        addToSearchHistory.mockRejectedValue(new Error("Failed to save history"));

        const expectedResponseData = mockResultsRows_1.map((row) => ({
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
        }));

        const response = await request(app).get("/api/search/").query({
            query: "Machine Learning",
            fromYear: 2015,
            toYear: 2025,
            paperType: "article",
            page: 2,
            limit: 2,
        });

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query: "Machine Learning",
            fromYear: 2015,
            toYear: 2025,
            paperType: "article",
            page: 2,
            limit: 2,
            offset: 2
        });

        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        expect(addToSearchHistory).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedResponseData);
    });


});
