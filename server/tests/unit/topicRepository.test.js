import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB pool's query method the queries the PostgreSQL DB for a paper with a particular id
vi.mock("./../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    },
}));

// Import after to replace the real function with the mock function
import pool from "../../src/config/db.js";
import { fetchTopicById } from "../../src/repositories/topicRepository.js";


const mockResolvedTopic = {
    id: "T10102",
    openalex_id: "8572",
    topic_display_name: "scientometrics and bibliometrics research",
    topic_description: "This cluster of papers focuses on bibliometric analysis, research evaluation, and the assessment of scientific impact. It covers topics such as citation networks, collaboration patterns, open access publishing, social impact assessment, altmetrics, co-authorship networks, and interdisciplinary research.",
    topic_keywords: [ "Bibliometric Analysis", "Research Evaluation", "Scientific Impact", "Citation Networks" ],
    topic_wikipedia_url: "https://en.wikipedia.org/wiki/Bibliometrics",
    domain_openalex_id: "2",
    domain_display_name: "Social Sciences",
    field_openalex_id: "18",
    field_display_name: "Decision Sciences",
    subfield_openalex_id: "1804",
    subfield_display_name: "Statistics, Probability and Uncertainty",
    works_count: 100166,
    cited_by_count: 886459,
    works_api_url: "https://api.openalex.org/works?filter=topics.id:T10102",
    openalex_created_at: new Date("2024-01-23T13:27:05.000Z"),
    openalex_updated_at: new Date("2026-06-05T00:02:21.000Z")
}


function expectFetchTopicQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM topics");
    expect(query).toContain("WHERE openalex_id = $1;");
} 

describe("fetchAuthorById", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches a topic for a valid openalex id", async () => {
        pool.query.mockResolvedValue({
            rows: [
                mockResolvedTopic
            ],
        });

        // The expected output is essentially the 1st element of the rows field, rows[0]
        const expectedOutput = mockResolvedTopic;
        
        const result = await fetchTopicById("T10102");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchTopicQuery(query);
        expect(params).toEqual(["T10102"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedOutput);
    });

    
    it("Fetches an empty array for an non-existent topic id", async () => {
        pool.query.mockResolvedValue({ 
            rows: [], 
        });

        const result = await fetchTopicById("T1010");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchTopicQuery(query);
        expect(params).toEqual(["T1010"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
    });

    // ------------- DATABASE ERRORS --------------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        const result = await expect(fetchTopicById("T10102")).rejects.toThrow("Unexpected DB error");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchTopicQuery(query);
        expect(params).toEqual(["T10102"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
    });
});
