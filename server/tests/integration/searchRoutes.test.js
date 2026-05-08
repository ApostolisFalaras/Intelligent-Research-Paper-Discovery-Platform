import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the search repository function that queries the PostgreSQL DB
vi.mock("./../../src/repositories/searchRepository.js", () => ({
    searchPapersByTextQuery: vi.fn()
}));

// Import after to replace the real function with the mock function
import { searchPapersByTextQuery } from "./../../src/repositories/searchRepository.js";
import app from "./../../src/app.js";

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

    // ------------ TESTS WITH DEFAULT FILTERS --------------

    it("Returns 200 and the found search results with default filters", async () => {
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

        const expectedResponseData = [
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

        const response = await request(app).get("/api/search/").query({query: "Machine Learning"}).expect(200);

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query: "Machine Learning"
        });
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        
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
        
        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual([]);
    });

    // -------------- TEST WITH COMBINATIONS OF FILTERS -------------
    
    it("Returns 200 and the found papers with filters", async () => {
        searchPapersByTextQuery.mockResolvedValue([
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
        ]);

        const expectedResponseData = [
            {
                id: "W3215633082",
                internalId: "864364",
                title: "Transformational machine learning: Learning how to learn from many related scientific problems",
                displayName: "Transformational machine learning: Learning how to learn from many related scientific problems",
                abstract: "Almost all machine learning (ML) is based on representing examples using intrinsic features...",
                publicationYear: 2021,
                citedByCount: 35,
                fwci: 4.0595,
                primarySource: "Proceedings of the National Academy of Sciences",
                primaryTopic: "Machine Learning and Data Classification",
                isOpenAccess: true,
                openAccessStatus: "hybrid",
                rank: 0.9999973,
                authorCount: 7,
                authorsPreview: [
                    { id: "A5028083196", name: "Iván Olier" },
                    { id: "A5084132314", name: "Oghenejokpeme I. Orhobor" }
                ]
            },
            {
                id: "W4400556081",
                internalId: "838182",
                title: "Hybrid Quantum-Classical Machine Learning Models: Powering the Future of AI",
                displayName: "Hybrid Quantum-Classical Machine Learning Models: Powering the Future of AI",
                abstract: "The burgeoning field of machine learning has transformed numerous sectors, ...",
                publicationYear: 2023,
                citedByCount: 30,
                fwci: 5.2198,
                primarySource: "Journal of Science & Technology",
                primaryTopic: "Quantum Computing Algorithms and Architecture",
                isOpenAccess: true,
                openAccessStatus: "diamond",
                rank: 0.99999547,
                authorCount: 1,
                authorsPreview: [
                    { id: "A5093749371", name: "Mohan Raja Pulicharla" }
                ]
            }
        ];

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

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedResponseData);
    });

    // ---------- USER ERROR -------------

    it("Returns 400 when the 'q' query parameter is missing", async () => {
        const response = await request(app).get("/api/search/").query({query: "   "}).expect(400);

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Search query is required");
    });


    // ------------ DATABASE ERROR --------------

    it("Returns 500 when the server fails", async () => {
        searchPapersByTextQuery.mockRejectedValue(new Error("Unexpected failure"));

        const response = await request(app).get("/api/search/").query({query: "Machine Learning"}).expect(500);

        expect(searchPapersByTextQuery).toHaveBeenCalledWith({
            ...defaultFilters,
            query: "Machine Learning"
        });

        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Unexpected failure");
    });

});
