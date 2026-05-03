import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the DB pool's query method the queries the PostgreSQL DB for a paper with a particular id
vi.mock("./../../src/repositories/searchRepository.js", () => ({
    searchPapersByTextQuery: vi.fn()
}));

// Import after to replace the real function with the mock function
import { searchPapersByTextQuery } from "./../../src/repositories/searchRepository.js";
import app from "./../../src/app.js";

describe("GET /api/search/?q=<search-query>", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("Returns 200 and the found search results", async () => {
        searchPapersByTextQuery.mockResolvedValue([
            {
                id: "830837",
                openalex_id: "W3108235655",
                title: "Python Machine Learning: Machine Learning and Deep Learning with Python, scikit-learn, and TensorFlow",
                display_name: "Python Machine Learning: Machine Learning and Deep Learning with Python, scikit-learn, and TensorFlow",
                abstract: null,
                publication_year: 2019,
                cited_by_count: 262,
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

        const response = await request(app).get("/api/search/").query({q: "Machine Learning"}).expect(200);

        expect(searchPapersByTextQuery).toHaveBeenCalledWith("Machine Learning");
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        
        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedResponseData);
    });


    it("Returns 200 but there were no search results", async () => {
        searchPapersByTextQuery.mockResolvedValue([]);

        const response = await request(app).get("/api/search/").query({q: "unknown query"}).expect(200);

        expect(searchPapersByTextQuery).toHaveBeenCalledWith("unknown query");
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        
        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual([]);
    });


    it("Returns 500 when the server fails", async () => {
        searchPapersByTextQuery.mockRejectedValue(new Error("Unexpected failure"));

        const response = await request(app).get("/api/search/").query({q: "Machine Learning"}).expect(500);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Internal server error");
    });

});
