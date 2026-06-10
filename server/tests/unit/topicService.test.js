import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository function the fetches a paper by id
vi.mock("./../../src/repositories/topicRepository.js", () => ({
    fetchTopicById: vi.fn()
}));

// Import after to replace the real function with the mock function
import { fetchTopicById } from "../../src/repositories/topicRepository.js";
import { getTopicById } from "../../src/services/topicService.js";

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


describe("getTopicById", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Returns a topic and maps it to a formatted paper DTO", async () => {
        fetchTopicById.mockResolvedValue(mockResolvedTopic);
        
        const result = await getTopicById("T10102");

        const expectedOutput = {
            id: mockResolvedTopic.openalex_id,
            internalId: mockResolvedTopic.id,
            displayName: mockResolvedTopic.topic_display_name,
            description: mockResolvedTopic.topic_description,
            keywords: mockResolvedTopic.topic_keywords,
            wikipediaURL: mockResolvedTopic.topic_wikipedia_url,
            domain: {
                id: mockResolvedTopic.domain_openalex_id,
                name: mockResolvedTopic.domain_display_name
            },
            field: {
                id: mockResolvedTopic.field_openalex_id,
                name: mockResolvedTopic.field_display_name
            },
            subfield: {
                id: mockResolvedTopic.subfield_openalex_id,
                name: mockResolvedTopic.subfield_display_name
            },
            worksCount: mockResolvedTopic.works_count,
            citedByCount: mockResolvedTopic.cited_by_count,
            worksApiURL: mockResolvedTopic.works_api_url,
            createdAt: mockResolvedTopic.openalex_created_at,
            updatedAt: mockResolvedTopic.openalex_updated_at
        };

        expect(fetchTopicById).toHaveBeenCalledWith("T10102");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(result).toEqual(expectedOutput);
    });

    // ------------ USER ERRORS --------------
    
    it("Throws a 400 AppError when input id is not a string", async () => {
        await expect(getTopicById(10102)).rejects.toThrow("'topic id' must be a string");

        // The invalid id is rejected before the repository function is called
        expect(fetchTopicById).not.toHaveBeenCalled();   
    });

    it("Throws a 400 AppError when input id has invalid format", async () => {
        await expect(getTopicById("10102")).rejects.toThrow("Invalid topic Id");

        // The invalid id is rejected before the repository function is called
        expect(fetchTopicById).not.toHaveBeenCalled();    
    });


    it("Throws a 404 AppError when topic doesn't exist", async () => {
        // Testing invalid paper ID input
        await expect(getTopicById("T1010")).rejects.toThrow("Topic not found");
        
        expect(fetchTopicById).toHaveBeenCalledWith("T1010");
        expect(fetchTopicById).toHaveBeenCalledTimes(1); 
    });

    // ------------ DATABASE ERRORS --------------

    it("Propagates repository error", async () => {
        fetchTopicById.mockRejectedValue(new Error("Database query failed."));

        await expect(getTopicById("T10102")).rejects.toThrow("Database query failed.");

        expect(fetchTopicById).toHaveBeenCalledWith("T10102");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);
    });
});