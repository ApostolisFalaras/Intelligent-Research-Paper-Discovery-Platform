import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the paper repository function that queries the PostgreSQL DB for a paper with a particular id
vi.mock("./../../src/repositories/topicRepository.js", () => ({ 
    fetchTopicById: vi.fn()
}));

// Import after to replace the real function with the mock function
import { fetchTopicById } from "../../src/repositories/topicRepository.js";
import app from "../../src/app.js";


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
    openalex_created_at: new Date("2024-01-23T13:27:05.000Z").toISOString(),
    openalex_updated_at: new Date("2026-06-05T00:02:21.000Z").toISOString()
}


describe("GET /api/topics/:id", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Returns 200 and the topic when found", async () => {
        fetchTopicById.mockResolvedValue(mockResolvedTopic);

        // The route's expected data output
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

        const response = await request(app).get("/api/topics/T10102").expect(200);

        expect(fetchTopicById).toHaveBeenCalledWith("T10102");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedOutput);
    });

    // ------------- USER ERRORS ---------------

    it("Returns 400 when topic Id doesn't follow the correct format", async () => {
        fetchTopicById.mockResolvedValue(null);

        const response = await request(app).get("/api/topics/10102").expect(400);

        expect(fetchTopicById).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Invalid topic Id");
    });


    it("Returns 404 when the topic doesn't exist", async () => {
        fetchTopicById.mockResolvedValue(null);

        const response = await request(app).get("/api/topics/T1010").expect(404);

        expect(fetchTopicById).toHaveBeenCalledWith("T1010");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Topic not found");
    });

    // -------------- DATABASE ERRORS --------------

    it("Returns 500 when the server fails", async () => {
        fetchTopicById.mockRejectedValue(new Error("Unexpected failure"));

        const response = await request(app).get("/api/topics/T10102").expect(500);

        expect(fetchTopicById).toHaveBeenCalledWith("T10102");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Unexpected failure");
    });
});
