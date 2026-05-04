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

    it("Returns an array of papers and maps them to an array of formatted DTOs", async () => {
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

        const results = await searchPapers({q: "Machine Learning"});

        const expectedOutput = [
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

        expect(searchPapersByTextQuery).toHaveBeenCalledWith("Machine Learning");
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        expect(results).toEqual(expectedOutput);
    });


    it("Returns an empty array when query doesn't retrieve any papers", async () => {
        searchPapersByTextQuery.mockResolvedValue([]);

        const results = await searchPapers({q: "unknown query"});

        expect(searchPapersByTextQuery).toHaveBeenCalledWith("unknown query");
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        expect(results).toEqual([]);
    });


    it("Trims the query before calling the repository function", async () => {
        // Since the trimming of input is checked here, 
        // we assume a query with no retrieved results for simplicity
        searchPapersByTextQuery.mockResolvedValue([]);

        const results = await searchPapers({q: "  unknown query   "});

        expect(searchPapersByTextQuery).toHaveBeenCalledWith("unknown query");
        expect(searchPapersByTextQuery).toHaveBeenCalledTimes(1);
        expect(results).toEqual([]);
    });


    it("Throws a 400 AppError when input q is missing", async () => {
        await expect(searchPapers({q: ""})).rejects.toThrow("Search query is required");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });


    it("Throws a 400 AppError when input q is whitespaces", async () => {
        await expect(searchPapers({q: "    "})).rejects.toThrow("Search query is required");

        expect(searchPapersByTextQuery).not.toHaveBeenCalled();
    });


    it("Propagates repository error", async () => {
        searchPapersByTextQuery.mockRejectedValue(new Error("Database query failed."));

        await expect(searchPapers({q: "machine learning"})).rejects.toThrow("Database query failed.");
    });
});