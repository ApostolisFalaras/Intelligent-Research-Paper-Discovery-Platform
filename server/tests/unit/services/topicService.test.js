import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository function the fetches a paper by id
vi.mock("../../../src/repositories/topicRepository.js", () => ({
    fetchAllTopics: vi.fn()
}));

// Import after to replace the real function with the mock function
import { fetchAllTopics } from "../../../src/repositories/topicRepository.js";
import { getAllTopics } from "../../../src/services/topicService.js";



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

describe("getAllTopics", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL CASE ----------

    it("Returns all topics successfully", async () => {
        fetchAllTopics.mockResolvedValue(mockResolvedTopics);

        const expectedResults = mockResolvedTopics.map((topic) => ({
            topicId: topic.primary_topic_openalex_id,
            topicName: topic.primary_topic_display_name,
            fieldId: topic.primary_field_openalex_id,
            fieldName: topic.primary_field_display_name
        }));

        const results = await getAllTopics();
        
        expect(fetchAllTopics).toHaveBeenCalledTimes(1);
        expect(results).toEqual(expectedResults);
    });

    // ---------- ERROR CASES ----------

    it("Throws 500 when an invalid repository result is returned", async () => {
        // Assuming an object instead of a list is returned from the repository
        fetchAllTopics.mockResolvedValue({...mockResolvedTopics});

        await expect(getAllTopics()).rejects.toThrow("Invalid repository result");
        
        expect(fetchAllTopics).toHaveBeenCalledTimes(1);
    });

    it("Propagates repository error", async () => {
        fetchAllTopics.mockRejectedValue(new Error("Database query failed."));

        await expect(getAllTopics()).rejects.toThrow("Database query failed.");
        
        expect(fetchAllTopics).toHaveBeenCalledTimes(1);
    });
});