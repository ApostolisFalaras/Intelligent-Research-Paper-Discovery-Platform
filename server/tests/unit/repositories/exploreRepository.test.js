import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
    default: {
        query: vi.fn()
    }
}));



import pool from "../../../src/config/db.js";
import { fetchRandomTopics, fetchRandomPapersByTopic, 
	fetchExploreTopicById, fetchExplorePapersByTopic, 
	fetchExploreTopicPaperCount } from "../../../src/repositories/exploreRepository.js";


describe("fetchRandomTopics", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Fetches random topics using the provided limit", async () => {
		const topics = [
			{
				id: 1,
				openalex_id: "T11250",
				topic_display_name: "Wave and Wind Energy Systems"
			}
		];

		pool.query.mockResolvedValue({ rows: topics });

		const result = await fetchRandomTopics(10);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("FROM topics");
		expect(query).toContain("ORDER BY RANDOM()");
		expect(query).toContain("LIMIT $1");
		expect(params).toEqual([10]);

		expect(result).toEqual(topics);
	});


	it("Uses 10 as the default limit", async () => {
		pool.query.mockResolvedValue({ rows: [] });

		await fetchRandomTopics();

		expect(pool.query).toHaveBeenCalledWith(expect.any(String), [10]);
	});
});


describe("fetchRandomPapersByTopic", () => {
	beforeEach(() => {
        vi.resetAllMocks();
    });

	it("Fetches random preview papers for a topic", async () => {
		const papers = [
			{
				id: 278335,
				openalex_id: "W1502981912"
			}
		];

		pool.query.mockResolvedValue({ rows: papers });

		const result = await fetchRandomPapersByTopic("T11250", 10);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("FROM paper_topics pt");
		expect(query).toContain("JOIN papers p");
		expect(query).toContain("LEFT JOIN paper_authors pa");
		expect(query).toContain("WHERE pt.topic_openalex_id = $1");
		expect(query).toContain("ORDER BY RANDOM()");
		expect(query).toContain("LIMIT $2");

		expect(params).toEqual(["T11250", 10]);

		expect(result).toEqual(papers);
	});


	it("Uses 10 as the default preview limit", async () => {
		pool.query.mockResolvedValue({ rows: [] });

		await fetchRandomPapersByTopic("T11250");

		expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["T11250", 10]);
	});
});


describe("fetchExploreTopicById", () => {
	beforeEach(() => {
        vi.resetAllMocks();
    });

	it("Fetches a topic by its OpenAlex id", async () => {
		const topic = {
			openalex_id: "T11250",
			topic_display_name: "Wave and Wind Energy Systems",
			field_display_name: "Engineering"
		};

		pool.query.mockResolvedValue({ rows: [topic] });

		const result = await fetchExploreTopicById("T11250");

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("FROM topics");
		expect(query).toContain("WHERE openalex_id = $1");
		expect(params).toEqual(["T11250"]);

		expect(result).toEqual(topic);
	});


	it("Returns undefined when the topic does not exist", async () => {
		pool.query.mockResolvedValue({ rows: [] });

		const result = await fetchExploreTopicById("T99999");

		expect(result).toBeUndefined();
	});
});


describe("fetchExplorePapersByTopic", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		
		pool.query.mockResolvedValue({
			rows: []
		});
	});


	it("Fetches paginated papers sorted by citations", async () => {
		await fetchExplorePapersByTopic("T11250", 25, 50, "citations");

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("FROM paper_topics pt");
		expect(query).toContain("JOIN papers p");
		expect(query).toContain("LEFT JOIN paper_authors pa");
		expect(query).toContain("LEFT JOIN paper_metrics pm");
		expect(query).toContain("WHERE pt.topic_openalex_id = $1");

		expect(query).toContain("p.cited_by_count DESC,");
		expect(query).toContain("p.id DESC");
		expect(query).toContain("LIMIT $2");
		expect(query).toContain("OFFSET $3");

		expect(params).toEqual(["T11250", 25, 50]);
	});


	it("Fetches papers sorted by publication year when sort is recent", async () => {
		await fetchExplorePapersByTopic("T11250", 25, 0, "recent");

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("p.publication_year DESC NULLS LAST,");
		expect(query).toContain("p.id DESC");
		expect(query).toContain("LIMIT $2");
		expect(query).toContain("OFFSET $3");

		expect(params).toEqual(["T11250", 25, 0]);
	});


	it("Fetches papers sorted by popularity when sort is popular", async () => {
		await fetchExplorePapersByTopic("T11250", 25, 0, "popular");

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("COALESCE(pm.popularity_score, 0) DESC,");
		expect(query).toContain("p.id DESC");
		expect(query).toContain("LIMIT $2");
		expect(query).toContain("OFFSET $3");

		expect(params).toEqual(["T11250", 25, 0]);
	});


	it("Returns the retrieved papers", async () => {
		const papers = [
			{
				id: 278335,
				openalex_id: "W1502981912"
			}
		];

		pool.query.mockResolvedValue({ rows: papers });

		const result = await fetchExplorePapersByTopic("T11250", 25, 0, "citations");

		expect(result).toEqual(papers);
	});
});


describe("fetchExploreTopicPaperCount", () => {
	beforeEach(() => {
        vi.resetAllMocks();
    });
	
	it("Returns the total number of distinct papers as a number", async () => {
		pool.query.mockResolvedValue({
			rows: [{ total_results: "40" }]
		});

		const result = await fetchExploreTopicPaperCount("T11250");

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("COUNT(DISTINCT pt.paper_id)");
		expect(query).toContain("WHERE pt.topic_openalex_id = $1");

		expect(params).toEqual(["T11250"]);

		expect(result).toBe(40);
		expect(typeof result).toBe("number");
	});
});