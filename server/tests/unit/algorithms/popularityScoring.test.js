import { describe, it, expect } from "vitest";
import { calculateGlobalPopularityScore } from "../../../src/algorithms/popularityScoring.js";

describe("calculateGlobalPopularityScore", () => {

	// ---------- GLOBAL POPULARITY SCORES CALCULATION FUNCTION  ----------

	it("Returns 1 when all paper metrics are at their maximum value", () => {
		const paper = {
			view_count: 100,
			save_count: 50,
			recommendation_click_count: 20,
			citation_score: 10,
			recency_score: 1
		};

		const ranges = {
			min_views: 0, max_views: 100,
			min_saves: 0, max_saves: 50,
			min_clicks: 0, max_clicks: 20,
			min_citations: 0, max_citations: 10,
			min_recency: 0, max_recency: 1
		};

		const result = calculateGlobalPopularityScore(paper, ranges);
		expect(result).toBe(1);
	});


	it("Returns 0 when all paper metrics are at their minimum value", () => {
		const paper = {
			view_count: 0,
			save_count: 0,
			recommendation_click_count: 0,
			citation_score: 0,
			recency_score: 0
		};

		const ranges = {
			min_views: 0, max_views: 100,
			min_saves: 0, max_saves: 50,
			min_clicks: 0, max_clicks: 20,
			min_citations: 0, max_citations: 10,
			min_recency: 0, max_recency: 1
		};

		const result = calculateGlobalPopularityScore(paper, ranges);
		expect(result).toBe(0);
	});

	it("Calculates the weighted popularity score from normalized metrics", () => {
		const paper = {
			view_count: 50, 
			save_count: 25,
			recommendation_click_count: 10,
			citation_score: 5,
			recency_score: 0.5
		};

		const ranges = {
			min_views: 0, max_views: 100,
			min_saves: 0, max_saves: 50,
			min_clicks: 0, max_clicks: 20,
			min_citations: 0, max_citations: 10,
			min_recency: 0, max_recency: 1
		};

		const result = calculateGlobalPopularityScore(paper, ranges);

		// Every normalized metric is 0.5
		// The formula is:
		// (0.2 * 0.5) + (0.3 * 0.5) + (0.15 * 0.5) + (0.25 * 0.5) + (0.10 * 0.5) = 0.5 
		expect(result).toBeCloseTo(0.5);
	});

	it("Applies the configured popularity weights correctly", () => {
		const paper = {
			view_count: 100,
			save_count: 0,
			recommendation_click_count: 20,
			citation_score: 0,
			recency_score: 1
		};

		const ranges = {
			min_views: 0, max_views: 100,
			min_saves: 0, max_saves: 50,
			min_clicks: 0, max_clicks: 20,
			min_citations: 0, max_citations: 10,
			min_recency: 0, max_recency: 1
		};

		const result = calculateGlobalPopularityScore(paper, ranges);

		// Every normalized metric is 0.5
		// The formula is:
		// (0.2 * 1) + (0.3 * 0) + (0.15 * 1) + (0.25 * 0) + (0.10 * 1) = 0.45 
		expect(result).toBeCloseTo(0.45);
	});

	it("Treats missing paper metric values as 0", () => {
		const paper = {
			view_count: 50
			// All other metrics are missing
		};

		const ranges = {
			min_views: 0, max_views: 100,
			min_saves: 0, max_saves: 50,
			min_clicks: 0, max_clicks: 20,
			min_citations: 0, max_citations: 10,
			min_recency: 0, max_recency: 1
		};

		const result = calculateGlobalPopularityScore(paper, ranges);

		// viewScore = 0.5
		// All missing metrics normalize to 0.
		//
		// 0.20 * 0.5 = 0.10
		expect(result).toBeCloseTo(0.1);
	});

	it("Returns 0 when all metric ranges have equal minimum and maximum values", () => {
		const paper = {
			view_count: 10,
			save_count: 5,
			recommendation_click_count: 2,
			citation_score: 20,
			recency_score: 0.5
		};

		const ranges = {
			min_views: 10, max_views: 10,
			min_saves: 5, max_saves: 5,
			min_clicks: 2, max_clicks: 2,
			min_citations: 20, max_citations: 20,
			min_recency: 0.5, max_recency: 0.5
		};

		const result = calculateGlobalPopularityScore(paper, ranges);
		expect(result).toBe(0);
	});
});