import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository function the fetches a paper by id
vi.mock("./../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    }
}));

// Import after to replace the real function with the mock function
import pool from "./../../src/config/db.js";
import { searchPapersByTextQuery } from "../../src/repositories/searchRepository.js";

describe("searchPapersByTextQuery", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("Queries the database with the search query and returns rows", async () => {
        const mockRows = [
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
        ];

        pool.query.mockResolvedValue({
            rows: mockRows,
        });

        const results = await searchPapersByTextQuery("Machine Learning");

        // Validating the query structure and the query parameter
        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT");
        expect(query).toContain("FROM papers p");
        expect(query).toContain("LEFT JOIN paper_authors pa ON pa.paper_id = p.id");
        expect(query).toContain("WHERE p.search_vector @@ websearch_to_tsquery('english', $1)");
        expect(query).toContain("ORDER BY rank DESC, p.cited_by_count DESC NULLS LAST");
        expect(query).toContain("LIMIT 25;");
        expect(params).toEqual(["Machine Learning"]);
            
        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(results).toEqual(mockRows);
    });


    it("Returns an empty array when no papers where found for the query", async () => {
        pool.query.mockResolvedValue({
            rows: [],
        });

        const results = await searchPapersByTextQuery("unknown query");

        // Validating the query structure and the query parameter
        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT");
        expect(query).toContain("FROM papers p");
        expect(query).toContain("LEFT JOIN paper_authors pa ON pa.paper_id = p.id");
        expect(query).toContain("WHERE p.search_vector @@ websearch_to_tsquery('english', $1)");
        expect(query).toContain("ORDER BY rank DESC, p.cited_by_count DESC NULLS LAST");
        expect(query).toContain("LIMIT 25;");
        expect(params).toEqual(["unknown query"]);
            
        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(results).toEqual([]);
    });


    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Database query failed."));

        const result = await expect(searchPapersByTextQuery("Machine Learning")).rejects.toThrow("Database query failed.");
    });
});