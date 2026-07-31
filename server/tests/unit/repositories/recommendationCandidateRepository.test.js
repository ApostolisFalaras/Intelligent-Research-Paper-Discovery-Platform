import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
	default: {
		query: vi.fn(),
		connect: vi.fn()
	}
}));

import pool from "../../../src/config/db.js";
import {
	fetchCandidatePapersFromSimilarUsers,
	fetchCandidatePapersFromSavedPaper,
	fetchCandidatePaperScoringRows,
	fetchExcludedPaperIds } from "../../../src/repositories/recommendationCandidateRepository.js";


// Providing 1 or 2 representative tests for each candidate repository function

describe("fetchCandidatePapersFromSimilarUsers", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Fetches unseen papers from similar users using the requested limit", async () => {
		// Mocking 1/5000 retrieved candidate papers
		const rows = [
			{ user_id: 43, paper_id: 101, view_count: 4, is_saved: true,
			  interest_score: 9, similarity_score: 0.85 }
		];

		pool.query.mockResolvedValue({ rows });

		const result = await fetchCandidatePapersFromSimilarUsers(42, 5000);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("SELECT");
		expect(query).toContain("upi.user_id,");
		expect(query).toContain("upi.paper_id,");
		expect(query).toContain("upi.view_count,");
		expect(query).toContain("upi.is_saved,");
		expect(query).toContain("upi.interest_score,");
		expect(query).toContain("usc.similarity_score");
		expect(query).toContain("FROM user_similarity_cache usc");
		expect(query).toContain("JOIN user_paper_interactions upi");
		expect(query).toContain("ON upi.user_id = usc.similar_user_id");
		expect(query).toContain("WHERE usc.user_id = $1");
		expect(query).toContain("AND upi.paper_id NOT IN (");
		expect(query).toContain("SELECT paper_id");
		expect(query).toContain("FROM user_paper_interactions");
		expect(query).toContain(")");
		expect(query).toContain("WHERE user_id = $1");
		expect(query).toContain("ORDER BY usc.similarity_score DESC, upi.interest_score DESC");
		expect(query).toContain("LIMIT $2;");

		expect(params).toEqual([42, 5000]);

		expect(result).toEqual(rows);
	});
});


describe("fetchCandidatePapersFromSavedPaper", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("fetches unseen papers similar to the user's saved papers", async () => {
		const rows = [
			{ paper_id: 201 },
			{ paper_id: 202 }
		];

		pool.query.mockResolvedValue({ rows });

		const result = await fetchCandidatePapersFromSavedPaper(42, 1000);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("SELECT psc.similar_paper_id AS paper_id");
		expect(query).toContain("FROM user_paper_interactions upi");
		expect(query).toContain("JOIN paper_similarity_cache psc");
		expect(query).toContain("ON psc.paper_id = upi.paper_id");
		expect(query).toContain("JOIN paper_recommendation_features prf");
		expect(query).toContain("ON prf.paper_id = psc.similar_paper_id");

		expect(query).toContain("WHERE upi.user_id = $1");
		expect(query).toContain("AND upi.is_saved = true");
		expect(query).toContain("AND psc.similar_paper_id NOT IN (");
		expect(query).toContain("SELECT paper_id");
		expect(query).toContain("FROM user_paper_interactions");
		expect(query).toContain(")");
		expect(query).toContain("ORDER BY psc.similarity_score DESC");
		expect(query).toContain("LIMIT $2;");

		expect(params).toEqual([42, 1000]);
		expect(result).toEqual(rows);
	});
});


describe("fetchCandidatePaperScoringRows", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns an empty array without querying when no candidate ids exist", async () => {
		const result = await fetchCandidatePaperScoringRows([]);

		expect(result).toEqual([]);
		expect(pool.query).not.toHaveBeenCalled();
	});

	it("Fetches all fields required by the recommendation algorithms", async () => {
		const candidateIds = [101, 102];

		const rows = [
			{
				paper_id: "101",
				topic_vector: { T1: 1 },
				citation_score: 0.8,
				recency_score: 0.7,
				view_count: "20",
				save_count: "4",
				recommendation_click_count: "2",
				popularity_score: 0.6
			}
		];

		pool.query.mockResolvedValue({ rows });

		const result = await fetchCandidatePaperScoringRows(candidateIds);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("SELECT"); 
		expect(query).toContain("prf.paper_id,");
		expect(query).toContain("prf.topic_vector,");
		expect(query).toContain("prf.field_vector,");
		expect(query).toContain("prf.subfield_vector,");
		expect(query).toContain("prf.domain_vector,");
		expect(query).toContain("prf.author_vector,");
		expect(query).toContain("prf.keyword_vector,");
		expect(query).toContain("prf.citation_score,");
		expect(query).toContain("prf.recency_score,");
		expect(query).toContain("COALESCE(pm.view_count, 0) AS view_count,");
		expect(query).toContain("COALESCE(pm.save_count, 0) AS save_count,");
		expect(query).toContain("COALESCE(pm.recommendation_click_count, 0) AS recommendation_click_count,");
		expect(query).toContain("COALESCE(pm.popularity_score, 0) AS popularity_score");
		expect(query).toContain("FROM paper_recommendation_features prf");
		expect(query).toContain("LEFT JOIN paper_metrics pm");
		expect(query).toContain("ON prf.paper_id = pm.paper_id");
		expect(query).toContain("WHERE prf.paper_id = ANY($1::bigint[]);");	
			
		expect(params).toEqual([candidateIds]);

		expect(result).toEqual(rows);
	});
});

describe("fetchExcludedPaperIds", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Converts PostgreSQL bigint paper ids into JavaScript numbers", async () => {
		pool.query.mockResolvedValue({
			rows: [ { paper_id: "101" }, { paper_id: "202" } ]
		});

		const result = await fetchExcludedPaperIds(42);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("SELECT paper_id");
		expect(query).toContain("FROM user_paper_interactions");
		expect(query).toContain("WHERE user_id = $1;");
		
		expect(params).toEqual([42]);

		expect(result).toEqual([101, 202]);
		expect(typeof result[0]).toBe("number");
	});
});