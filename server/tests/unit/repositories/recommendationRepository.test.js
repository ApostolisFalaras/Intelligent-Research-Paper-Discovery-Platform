import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
	default: {
		query: vi.fn()
	}
}));

import pool from "../../../src/config/db.js";

import {
	fetchPopularRecommendations,
	fetchContentRecommendations,
	fetchUserRecommendations,
	fetchTopicRecommendations
} from "../../../src/repositories/recommendationRepository.js";

// 1 representative success test case for each repository function

describe("fetchPopularRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});
				

	it("Fetches popular recommendations with limit and offset", async () => {
		const rows = [
			{
				id: 3,
				openalex_id: "W2108971421",
				title: "Trace Element Discrimination Diagrams for the Tectonic Interpretation of Granitic Rocks",
				abstract: "Granites may be subdivided according to their intrusive settings into four main groups—ocean ridge granites...",
				publication_year: 1984,
				cited_by_count: 8476,
				fwci: 17.0714,
				primary_source_display_name: "Journal of Petrology",
				primary_topic_display_name: "Geological and Geochemical Analysis",
				is_open_access: true,
				open_access_status: "bronze",
				popularity_score: 0.000000,
				author_count: 3,
				authors_preview: [
					{ id: "A5107656345", name: "Julian A. Pearce" },
					{ id: "A5063959636", name: "Nigel Harris" }
				]
			},
			{
				id: 4,
				openalex_id: "W1960471763",
				title: "New empirical relationships among magnitude, rupture length, rupture width, rupture area, and surface displacement",
				abstract: "Abstract Source parameters for historical earthquakes worldwide are compiled to develop...",
				publication_year: 1994,
				cited_by_count: 7668,
				fwci: 42.8565,
				primary_source_display_name: "Bulletin of the Seismological Society of America",
				primary_topic_display_name: "earthquake and tectonic studies",
				is_open_access: true,
				open_access_status: "closed",
				popularity_score: 0.000000,
				author_count: 2,
				authors_preview: [
					{ id: "A5086955679", name: "Donald Wells" },
					{ id: "A5062202473", name: "Kevin J. Coppersmith" }
				]
			}
		];

		pool.query.mockResolvedValue({ rows });

		const result = await fetchPopularRecommendations(2, 2);

		const [query, params] = pool.query.mock.calls[0];

		// Mocking the most important parts of the query string
		// As the similar query structure has been thouroughly verified for the search case 
		expect(query).toContain("FROM paper_metrics pm");
		expect(query).toContain("JOIN papers p ON p.id = pm.paper_id");
		expect(query).toContain("ORDER BY pm.popularity_score DESC");
		expect(query).toContain("LIMIT $1");
		expect(query).toContain("OFFSET $2");

		expect(params).toEqual([2, 2]);
		expect(result).toEqual(rows);
	});
});


describe("fetchContentRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Detches content-based recommendations ordered by content score", async () => {
		const rows = [
			{
				id: 410153,
				openalex_id: "W1967479744",
				title: "A novel ecological network-based computation platform as a grid middleware system",
				display_name: "A novel ecological network-based computation platform as a grid middleware system",
				abstract: "Next-generation grid systems where the emphasis shifts to distributed global collaboration, a service-oriented approach...",
				publication_year: 2004,
				cited_by_count: 44,
				fwci: 2.5492,
				primary_source_display_name: "International Journal of Intelligent Systems",
				primary_topic_display_name: "Distributed and Parallel Computing Systems",
				is_open_access: false,
				open_access_status: "closed",
				content_score: 0.705546,
				author_count: 3,
				authors_preview: [
					{ id: "A5002631807", name: "Lei Gao"}, 
					{ id: "A5100688228", name: "Yongsheng Ding"}
				]
			},
			{
				id: 411944,
				openalex_id: "W7154247537",
				title: "Design and Operation of a Federated GPU Cluster for Digital Humanities within DHinfra.at",
				display_name: "Design and Operation of a Federated GPU Cluster for Digital Humanities within DHinfra.at",
				abstract: "Earlier plans for a federated GPU cluster for Digital Humanities (DH) were presented at ASHPC24...",
				publication_year: 2026,
				cited_by_count: 0,
				fwci: 0.0000,
				primary_source_display_name: "Zenodo (CERN European Organization for Nuclear Research)",
				primary_topic_display_name: "Distributed and Parallel Computing Systems",
				is_open_access: true,
				open_access_status: "green",
				content_score: 0.700965,
				author_count: 5,
				authors_preview: [
					{ id: "A5028061340", name: "Florian Atzenhofer-Baumgartner"}, 
					{ id: "A5093734247", name: "David Fleischhacker"}
				]
			}
		];

		pool.query.mockResolvedValue({ rows });

		const result = await fetchContentRecommendations(81, 2, 4);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("FROM user_recommendation_cache urc");
		expect(query).toContain("WHERE urc.user_id = $1");
		expect(query).toContain("ORDER BY urc.content_score DESC");

		expect(params).toEqual([81, 2, 4]);
		expect(result).toEqual(rows);
	});
});


describe("fetchUserRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});


	it("Fetches user-based recommendations ordered by collaborative score", async () => {
		const rows = [
			{
				id: 947479,
				openalex_id: "W2559597482",
				title: "The One Hundred Layers Tiramisu: Fully Convolutional DenseNets for Semantic Segmentation",
				display_name: "The One Hundred Layers Tiramisu: Fully Convolutional DenseNets for Semantic Segmentation",
				abstract: "State-of-the-art approaches for semantic image segmentation are built on Convolutional Neural Networks (CNNs). The typical segmentation architecture is...",
				publication_year: 2017,
				cited_by_count: 1745,
				fwci: 1745,
				primary_source_display_name: null,
				primary_topic_display_name: "Advanced Neural Network Applications",
				is_open_access: false,
				open_access_status: "closed",
				content_score: 0.871036,
				author_count: 5,
				authors_preview: [
					{id: "A5033401905", name: "Simon Jégou"}, 
					{id: "A5024536150", name: "Michal Drozdzal"}
				]
			},
			{
				id: 387001,
				openalex_id: "W2804142383",
				title: "The FAIR guiding principles for data stewardship: fair enough?",
				display_name: "The FAIR guiding principles for data stewardship: fair enough?",
				abstract: "The FAIR guiding principles for research data stewardship (findability, accessibility, interoperability, and reusability) look set to become a cornerstone of research in the life sciences. A critical appraisal of these principles in light of ongoing discussions and developments about data sharing is in order. The FAIR principles point...",
				publication_year: 2018,
				cited_by_count: 295,
				fwci: 37.8219,
				primary_source_display_name: "European Journal of Human Genetics",
				primary_topic_display_name: "Research Data Management Practices",
				is_open_access: true,
				open_access_status: "hybrid",
				content_score: 0.765948,
				author_count: 3,
				authors_preview: [
					{id: "A5067542542", name: "Martin Boeckhout"},
					{id: "A5113678363", name: "Gerhard A. Zielhuis"}
				]
			}
		];

		pool.query.mockResolvedValue({ rows });

		await fetchUserRecommendations(81, 2, 3);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("urc.collaborative_score");
		expect(query).toContain("ORDER BY urc.collaborative_score DESC");
		expect(params).toEqual([81, 2, 3]);
	});
});


describe("fetchTopicRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Fetches topic-based recommendations ordered by topic score", async () => {
		const rows = [
			{
				id: 411944,
				openalex_id: "W7154247537",
				title: "Design and Operation of a Federated GPU Cluster for Digital Humanities within DHinfra.at",
				display_name: "Design and Operation of a Federated GPU Cluster for Digital Humanities within DHinfra.at",
				abstract: "Earlier plans for a federated GPU cluster for Digital Humanities (DH) were presented at ASHPC24...",
				publication_year: 2026,
				cited_by_count: 0,
				fwci: 0.0000,
				primary_source_display_name: "Zenodo (CERN European Organization for Nuclear Research)",
				primary_topic_display_name: "Distributed and Parallel Computing Systems",
				is_open_access: true,
				open_access_status: "green",
				content_score: 0.851694,
				author_count: 5,
				authors_preview: [
					{ id: "A5028061340", name: "Florian Atzenhofer-Baumgartner"}, 
					{ id: "A5093734247", name: "David Fleischhacker"}
				]
			},
			{
				id: 387196,
				openalex_id: "W2967060868",
				title: "Rucio: Scientific Data Management",
				display_name: "Rucio: Scientific Data Management",
				abstract: "Rucio is an open-source software framework that provides scientific collaborations with the functionality to organize, manage, and access their data at scale. The data can be...",
				publication_year: 2019,
				cited_by_count: 175,
				fwci: 12.0715,
				primary_source_display_name: "Computing and Software for Big Science",
				primary_topic_display_name: "Distributed and Parallel Computing Systems",
				is_open_access: true,
				open_access_status: "hybrid",
				content_score: 0.844030,
				author_count: 0,
				authors_preview: []
			}
		];

		pool.query.mockResolvedValue({ rows: [] });

		await fetchTopicRecommendations(81, 2, 2);

		const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("urc.topic_score");
		expect(query).toContain("ORDER BY urc.topic_score DESC");
		expect(params).toEqual([81, 2, 2]);
	});
});
