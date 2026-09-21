import { beforeEach, describe, expect, it, vi } from "vitest";


vi.mock("../../../src/repositories/exploreRepository.js", () => ({
    fetchRandomTopics: vi.fn(),
    fetchRandomPapersByTopic: vi.fn(),
    fetchExplorePapersByTopic: vi.fn(),
    fetchExploreTopicPaperCount: vi.fn(),
    fetchExploreTopicById: vi.fn()
}));


import { fetchRandomTopics, fetchRandomPapersByTopic, 
	fetchExplorePapersByTopic, fetchExploreTopicPaperCount, 
	fetchExploreTopicById } from "../../../src/repositories/exploreRepository.js";
import { getExploreContent, getExploreTopic } from "../../../src/services/exploreService.js";


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


describe("getExploreContent", () => {

	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL CASES ----------

	it("Returns exploration sections with topics and mapped paper DTOs", async () => {
		fetchRandomTopics.mockResolvedValue([mockTopic]);
		fetchRandomPapersByTopic.mockResolvedValue([mockPaper]);

		const result = await getExploreContent();

		expect(fetchRandomTopics).toHaveBeenCalledWith(10);
		expect(fetchRandomPapersByTopic).toHaveBeenCalledWith("T11250", 10);

		expect(result).toEqual([
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
	});


	it("Returns an empty array when no exploration topics are found", async () => {
		fetchRandomTopics.mockResolvedValue([]);

		const result = await getExploreContent();

		expect(result).toEqual([]);

		expect(fetchRandomPapersByTopic).not.toHaveBeenCalled();
	});


	it("Fetches preview papers for every retrieved topic", async () => {
		const topics = [
			mockTopic,
			{
				...mockTopic,
				id: 43,
				openalex_id: "T10001",
				topic_display_name: "Artificial Intelligence"
			}
		];

		fetchRandomTopics.mockResolvedValue(topics);

		fetchRandomPapersByTopic
			.mockResolvedValueOnce([mockPaper])
			.mockResolvedValueOnce([{ ...mockPaper, id: "300000", openalex_id: "W2000000000"}]);

		const result = await getExploreContent();

		expect(fetchRandomPapersByTopic).toHaveBeenCalledTimes(2);
		expect(fetchRandomPapersByTopic).toHaveBeenNthCalledWith(1, "T11250", 10);
		expect(fetchRandomPapersByTopic).toHaveBeenNthCalledWith(2, "T10001", 10);

		expect(result).toHaveLength(2);
	});


	// ---------- ERROR CASES ----------

	it("Propagates repository errors", async () => {
		fetchRandomTopics.mockRejectedValue(new Error("Unexpected DB error"));

		await expect(getExploreContent()).rejects.toThrow("Unexpected DB error");
	});
});


describe("getExploreTopic", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});


	// ---------- SUCCESSFUL CASES ----------

	it("Returns a paginated topic with mapped papers", async () => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([mockPaper]);
		fetchExploreTopicPaperCount.mockResolvedValue(40);

		const result = await getExploreTopic("T11250", 1, 25, "citations");

		expect(fetchExploreTopicById).toHaveBeenCalledWith("T11250");

		expect(fetchExplorePapersByTopic).toHaveBeenCalledWith("T11250", 25, 0, "citations");
		expect(fetchExploreTopicPaperCount).toHaveBeenCalledWith("T11250");

		expect(result).toEqual({
			topic: {
				id: "T11250",
				displayName: "Wave and Wind Energy Systems",
				fieldDisplayName: "Engineering"
			},
			totalResults: 40,
			page: 1,
			limit: 25,
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
		});
	});


	it("Uses the correct offset for later pages", async () => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([mockPaper]);
		fetchExploreTopicPaperCount.mockResolvedValue(40);

		await getExploreTopic("T11250", 3, 25, "recent");

		expect(fetchExplorePapersByTopic).toHaveBeenCalledWith("T11250", 25, 50, "recent");
	});


	it("Uses the default pagination and sorting values", async () => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([mockPaper]);
		fetchExploreTopicPaperCount.mockResolvedValue(40);

		await getExploreTopic("T11250");

		expect(fetchExplorePapersByTopic).toHaveBeenCalledWith("T11250", 25, 0, "citations");
	});


	it("Accepts the 'citations' sorting option", async () => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([mockPaper]);
		fetchExploreTopicPaperCount.mockResolvedValue(40);

		await getExploreTopic("T11250", 1, 25, "citations");

		expect(fetchExplorePapersByTopic).toHaveBeenCalledWith("T11250", 25, 0, "citations");
		expect(fetchExplorePapersByTopic).toHaveBeenCalledTimes(1);
	});

	it("Accepts the 'recent' sorting option", async () => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([mockPaper]);
		fetchExploreTopicPaperCount.mockResolvedValue(40);

		await getExploreTopic("T11250", 1, 25, "recent");

		expect(fetchExplorePapersByTopic).toHaveBeenCalledWith("T11250", 25, 0, "recent");
		expect(fetchExplorePapersByTopic).toHaveBeenCalledTimes(1);
	});

	it("Accepts the 'popular' sorting option", async () => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([mockPaper]);
		fetchExploreTopicPaperCount.mockResolvedValue(40);

		await getExploreTopic("T11250", 1, 25, "popular");

		expect(fetchExplorePapersByTopic).toHaveBeenCalledWith("T11250", 25, 0, "popular");
		expect(fetchExplorePapersByTopic).toHaveBeenCalledTimes(1);
			
	});


	it("Throws 400 for an invalid topic id", async () => {
		await expect(getExploreTopic("invalid", 1, 25, "citations"))
			.rejects
			.toMatchObject({
				message: "Invalid topic id",
				statusCode: 400
			});

		expect(fetchExploreTopicById).not.toHaveBeenCalled();
		expect(fetchExplorePapersByTopic).not.toHaveBeenCalled();
		expect(fetchExploreTopicPaperCount).not.toHaveBeenCalled();
	});


	it("Throws 400 when page is less than 1", async () => {
		await expect(getExploreTopic("T11250", 0, 25, "citations"))
			.rejects
			.toMatchObject({
				message: "'page' must be greater than or equal to 1",
				statusCode: 400
			});
	});


	it("Throws 400 for invalid limit 0", async () => {
		await expect(getExploreTopic("T11250", 1, 0, "citations"))
			.rejects
			.toMatchObject({
				message: "'limit' must be between 1 and 100",
				statusCode: 400
			});
	});

	it("Throws 400 for invalid limit 101", async () => {
		await expect(getExploreTopic("T11250", 1, 101, "citations"))
			.rejects
			.toMatchObject({
				message: "'limit' must be between 1 and 100",
				statusCode: 400
			});
	});

	it("Throws 400 for an unsupported sorting option", async () => {
		await expect(getExploreTopic("T11250", 1, 25, "invalid"))
			.rejects
			.toMatchObject({
				message: "Invalid explore sort",
				statusCode: 400
			});

		expect(fetchExploreTopicById).not.toHaveBeenCalled();
	});


	it("Throws 404 when the topic does not exist", async () => {
		fetchExploreTopicById.mockResolvedValue(undefined);

		await expect(getExploreTopic("T99999", 1, 25, "citations"))
			.rejects
			.toMatchObject({
				message: "Topic not found",
				statusCode: 404
			});
	});


	it("Returns an empty papers array when the topic has no papers", async () => {
		fetchExploreTopicById.mockResolvedValue(mockTopic);
		fetchExplorePapersByTopic.mockResolvedValue([]);
		fetchExploreTopicPaperCount.mockResolvedValue(0);

		const result = await getExploreTopic(
			"T11250",
			1,
			25,
			"citations"
		);

		expect(result.totalResults).toBe(0);
		expect(result.papers).toEqual([]);
	});


	it("Propagates repository errors", async () => {
		fetchExploreTopicById.mockRejectedValue(new Error("Unexpected DB error"));

		await expect(getExploreTopic("T11250", 1, 25, "citations"))
			.rejects
			.toThrow("Unexpected DB error");
	});
});
