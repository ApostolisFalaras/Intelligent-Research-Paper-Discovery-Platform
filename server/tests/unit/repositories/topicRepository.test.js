import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB pool's query method the queries the PostgreSQL DB for a paper with a particular id
vi.mock("../../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    },
}));

// Import after to replace the real function with the mock function
import pool from "../../../src/config/db.js";
import { fetchAllTopics } from "../../../src/repositories/topicRepository.js";



// Mocking only the first 5 out of 4392 topics
const mockResolvedTopics = [
    {
        primary_topic_display_name: "14-3-3 protein interactions", primary_topic_openalex_id: "T13526",
        primary_field_display_name: "Biochemistry, Genetics and Molecular Biology", primary_field_openalex_id: "13"
    },
    {
        primary_topic_display_name: "21st Century Education and Governance", primary_topic_openalex_id: "T14027",
        primary_field_display_name: "Social Sciences", primary_field_openalex_id: "33"
    },
    {
        primary_topic_display_name: "2D Materials and Applications", primary_topic_openalex_id: "T10275",
        primary_field_display_name: "Materials Science", primary_field_openalex_id: "25"
    },
    {
        primary_topic_display_name: "3D IC and TSV technologies",
        primary_topic_openalex_id: "T11527",
        primary_field_display_name: "Engineering",
        primary_field_openalex_id: "22"
    },
    {
        primary_topic_display_name: "3D Modeling in Geospatial Applications",
        primary_topic_openalex_id: "T12698",
        primary_field_display_name: "Engineering",
        primary_field_openalex_id: "22"
    },
];

// Helper function
function expectFetchAllTopicsQuery(query) {
    expect(query).toContain("SELECT DISTINCT primary_topic_display_name,");
    expect(query).toContain("primary_topic_openalex_id,");
    expect(query).toContain("primary_field_display_name,");
    expect(query).toContain("primary_field_openalex_id");
    expect(query).toContain("FROM papers");
    expect(query).toContain("WHERE primary_topic_openalex_id IS NOT NULL;");
}

describe("fetchAllTopics", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL CASE ----------

    it("Fetches all topics successfully", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedTopics
        });

        const results = await fetchAllTopics();

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAllTopicsQuery(query);
        expect(params).toEqual(undefined);
        expect(results).toEqual(mockResolvedTopics);
    });

    it("Fetches all topics successfully but in the wrong format", async () => {
        // Fetching the topic rows as an object and not a list,
        // is a successful execution case of the repository, but not for the service layer function
        pool.query.mockResolvedValue({
            rows: { ...mockResolvedTopics}
        });

        const results = await fetchAllTopics();

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAllTopicsQuery(query);
        expect(params).toEqual(undefined);
        expect(results).toEqual({...mockResolvedTopics});
    });

    // ---------- ERROR CASES ----------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchAllTopics()).rejects.toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAllTopicsQuery(query);
        expect(params).toEqual(undefined);
    });
});
