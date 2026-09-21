import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/exploreRepository.js", () => ({
    fetchRandomTopics: vi.fn(),
    fetchRandomPapersByTopic: vi.fn(),
    fetchExplorePapersByTopic: vi.fn(),
    fetchExploreTopicPaperCount: vi.fn(),
    fetchExploreTopicById: vi.fn()
}));


import app from "../../src/app.js";

import { fetchRandomTopics, fetchRandomPapersByTopic,
    fetchExplorePapersByTopic, fetchExploreTopicPaperCount,
    fetchExploreTopicById } from "../../src/repositories/exploreRepository.js";


const mockTopic = {
    id: 42,
    openalex_id: "T11250",
    topic_display_name: "Wave and Wind Energy Systems",
    field_display_name: "Engineering",
    topic_description: "Research related to wave and wind energy.",
    works_count: "1500",
    cited_by_count: "25000"
};

const mockPaper = {
    id: "278335",
    openalex_id: "W1502981912",
    title: "ESTIMATION OF INCIDENT AND REFLECTED WAVES IN RANDOM WAVE EXPERIMENTS",
    display_name: "ESTIMATION OF INCIDENT AND REFLECTED WAVES IN RANDOM WAVE EXPERIMENTS",
    abstract: "Paper abstract",
    publication_year: 1976,
    cited_by_count: 743,
    fwci: "2.45",
    primary_source_display_name: "Coastal Engineering Proceedings",
    primary_topic_display_name: "Ocean Waves and Remote Sensing",
    is_open_access: true,
    open_access_status: "diamond",
    author_count: "2",
    authors_preview: [
        {
            id: "A5086326747",
            name: "Yoshimi Goda"
        },
        {
            id: "A5008838973",
            name: "Tasumasa Suzuki"
        }
    ]
};


describe("GET /api/explore", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns exploration topic sections", async () => {
		fetchRandomTopics.mockResolvedValue([mockTopic]);
		fetchRandomPapersByTopic.mockResolvedValue([mockPaper]);

		const response = await request(app)
			.get("/api/explore");

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("success");

		expect(response.body.data).toEqual([
			{
				topic: {
					id: "T11250",
					internalId: 42,
					displayName: "Wave and Wind Energy Systems",
					fieldDisplayName: "Engineering",
					description: "Research related to wave and wind energy.",
					worksCount: 1500,
					citedByCount: 25000
				},
				papers: [
					{
						id: "W1502981912",
						internalId: "278335",
						title: "ESTIMATION OF INCIDENT AND REFLECTED WAVES IN RANDOM WAVE EXPERIMENTS",
						displayName: "ESTIMATION OF INCIDENT AND REFLECTED WAVES IN RANDOM WAVE EXPERIMENTS",
						abstract: "Paper abstract",
						publicationYear: 1976,
						citedByCount: 743,
						fwci: 2.45,
						primarySource: "Coastal Engineering Proceedings",
						primaryTopic: "Ocean Waves and Remote Sensing",
						isOpenAccess: true,
						openAccessStatus: "diamond",
						authorCount: 2,
						authorsPreview: [
							{
								id: "A5086326747",
								name: "Yoshimi Goda"
							},
							{
								id: "A5008838973",
								name: "Tasumasa Suzuki"
							}
						]
					}
				]
			}
		]);

		expect(fetchRandomTopics)
			.toHaveBeenCalledWith(10);

		expect(fetchRandomPapersByTopic)
			.toHaveBeenCalledWith("T11250", 10);
	});


	it("Returns an empty array when there are no exploration topics", async () => {
		fetchRandomTopics.mockResolvedValue([]);

		const response = await request(app)
			.get("/api/explore");

		expect(response.status).toBe(200);

		expect(response.body).toEqual({
			status: "success",
			data: []
		});
	});


	it("Returns 500 when the repository fails", async () => {
		fetchRandomTopics.mockRejectedValue(
			new Error("Unexpected DB error")
		);

		const response = await request(app)
			.get("/api/explore");

		expect(response.status).toBe(500);
	});
});


describe("GET /api/explore/:topicId", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});


	it("Returns papers for the requested topic", async () => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([mockPaper]);
		fetchExploreTopicPaperCount.mockResolvedValue(40);

		const response = await request(app).get("/api/explore/T11250").expect(200);

		expect(fetchExplorePapersByTopic).toHaveBeenCalledWith("T11250",25,0,"citations");
		expect(fetchExplorePapersByTopic).toHaveBeenCalledTimes(1);

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("success");

		expect(response.body.data.topic).toEqual({
			id: "T11250",
			displayName: "Wave and Wind Energy Systems",
			fieldDisplayName: "Engineering"
		});

		expect(response.body.data.totalResults).toBe(40);
		expect(response.body.data.page).toBe(1);
		expect(response.body.data.limit).toBe(25);

		expect(response.body.data.papers).toHaveLength(1);

		
	});


	it("Applies page, limit, and sort query parameters", async () => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([mockPaper]);
		fetchExploreTopicPaperCount.mockResolvedValue(40);

		const response = await request(app)
			.get("/api/explore/T11250?page=3&limit=10&sort=recent")
			.expect(200);

		expect(fetchExplorePapersByTopic).toHaveBeenCalledWith("T11250", 10, 20, "recent");
		expect(fetchExplorePapersByTopic).toHaveBeenCalledTimes(1);

		expect(response.status).toBe(200);
		expect(response.body.data.page).toBe(3);
		expect(response.body.data.limit).toBe(10);
	});


	it.each([
		["citations"],
		["recent"],
		["popular"]
	])("Accepts sort=%s", async (sort) => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([mockPaper]);
		fetchExploreTopicPaperCount.mockResolvedValue(40);

		const response = await request(app).get(`/api/explore/T11250?sort=${sort}`).expect(200);

		expect(response.status).toBe(200);

		expect(fetchExplorePapersByTopic).toHaveBeenCalledWith("T11250", 25, 0, sort);
		expect(fetchExplorePapersByTopic).toHaveBeenCalledTimes(1);
	});


	it("Returns 400 for an invalid topic id", async () => {
		
		const response = await request(app).get("/api/explore/invalid").expect(400);

		expect(response.status).toBe(400);
		expect(response.body.message).toBe(
			"Invalid topic id"
		);

		expect(fetchExploreTopicById)
			.not.toHaveBeenCalled();
	});


	it("Returns 400 when page is less than 1", async () => {
		const response = await request(app).get("/api/explore/T11250?page=0").expect(400);

		expect(response.status).toBe(400);
		expect(response.body.message).toBe("'page' must be greater than or equal to 1");
	});


	it("Returns 400 when limit is less than 1", async () => {
		const response = await request(app).get("/api/explore/T11250?limit=0").expect(400);

		expect(response.status).toBe(400);
		expect(response.body.message).toBe("'limit' must be between 1 and 100");
	});


	it("Returns 400 when limit exceeds 100", async () => {
		const response = await request(app).get("/api/explore/T11250?limit=101").expect(400);

		expect(response.status).toBe(400);
		expect(response.body.message).toBe("'limit' must be between 1 and 100");
	});


	it("Returns 400 for an invalid sorting option", async () => {
		const response = await request(app).get("/api/explore/T11250?sort=invalid").expect(400);

		expect(response.status).toBe(400);
		expect(response.body.message).toBe("Invalid explore sort");
	});


	it("Returns 404 when the topic does not exist", async () => {
		fetchExploreTopicById.mockResolvedValue(undefined);

		const response = await request(app).get("/api/explore/T99999").expect(404);

		expect(response.status).toBe(404);
		expect(response.body.message).toBe("Topic not found");
	});


	it("Returns an empty paper list for a topic with no papers", async () => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([]);
		fetchExploreTopicPaperCount.mockResolvedValue(0);

		const response = await request(app).get("/api/explore/T11250").expect(200);

		expect(response.status).toBe(200);
		expect(response.body.data.totalResults).toBe(0);
		expect(response.body.data.papers).toEqual([]);
	});


	it("Returns 500 when the repository fails", async () => {
		fetchExploreTopicById.mockRejectedValue(new Error("Unexpected DB error"));

		const response = await request(app).get("/api/explore/T11250").expect(500);

		expect(response.status).toBe(500);
	});
});
