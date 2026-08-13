import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/repositories/recommendationRepository.js", () => ({
	fetchPopularRecommendations: vi.fn(),
	fetchContentRecommendations: vi.fn(),
	fetchUserRecommendations: vi.fn(),
	fetchTopicRecommendations: vi.fn()
}));

vi.mock("../../../src/repositories/recommendationProfileRepository.js", () => ({
	fetchUserInteractionsCount: vi.fn()
}));

import {
	fetchPopularRecommendations, fetchContentRecommendations,
	fetchUserRecommendations, fetchTopicRecommendations
} from "../../../src/repositories/recommendationRepository.js";

import { fetchUserInteractionsCount } from "../../../src/repositories/recommendationProfileRepository.js";
import {
	getHomeRecommendations, getPopularRecommendations, getContentRecommendations,
	getUserRecommendations, getTopicRecommendations } from "../../../src/services/recommendationService.js";


function expectedPaperDTO(papers) {
	return papers.map((paper) => ({
		id: paper.openalex_id,
		internalId: paper.id,
		title: paper.title,
		displayName: paper.display_name,
		abstract: paper.abstract,
		publicationYear: paper.publication_year,
		citedByCount: paper.cited_by_count,
		fwci: Number(paper.fwci),
		primarySource: paper.primary_source_display_name,
		primaryTopic: paper.primary_topic_display_name,
		isOpenAccess: paper.is_open_access,
		openAccessStatus: paper.open_access_status,
		rank: Number(paper.rank),
		authorCount: Number(paper.author_count),
		authorsPreview: paper.authors_preview,
	}));
}

const popularPapers = [
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

const popularPapersDTO = expectedPaperDTO(popularPapers);

const contentBasedRecoms = [
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

const contentBasedRecomsDTO = expectedPaperDTO(contentBasedRecoms);

const userBasedRecoms = [
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

const userBasedRecomsDTO = expectedPaperDTO(userBasedRecoms);

const topicBasedRecoms = [
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

const topicBasedRecomsDTO = expectedPaperDTO(topicBasedRecoms);


describe("getHomeRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns popular recommendations for an unauthenticated user", async () => {
		fetchPopularRecommendations.mockResolvedValue(popularPapers);

		const result = await getHomeRecommendations(null);

		expect(fetchPopularRecommendations).toHaveBeenCalledWith(10);

		expect(fetchUserInteractionsCount).not.toHaveBeenCalled();
		expect(fetchContentRecommendations).not.toHaveBeenCalled();
		expect(fetchUserRecommendations).not.toHaveBeenCalled();
		expect(fetchTopicRecommendations).not.toHaveBeenCalled();

		expect(result).toEqual({
			authenticated: false,
			sections: [
				{
					header: "Popular papers",
					papers: popularPapersDTO
				}
			]
		});
	});

	it("Returns popular recommendations for an authenticated user with no interactions", async () => {
		fetchUserInteractionsCount.mockResolvedValue({ num_interactions: 0 });
		fetchPopularRecommendations.mockResolvedValue(popularPapers);

		const result = await getHomeRecommendations(42);

		expect(fetchUserInteractionsCount).toHaveBeenCalledWith(42);
		expect(fetchPopularRecommendations).toHaveBeenCalledWith(10);

		expect(fetchContentRecommendations).not.toHaveBeenCalled();
		expect(fetchUserRecommendations).not.toHaveBeenCalled();
		expect(fetchTopicRecommendations).not.toHaveBeenCalled();

		expect(result).toEqual({
			authenticated: true,
			sections: [
				{
					header: "Popular papers",
					papers: popularPapersDTO
				}
			]
		});
	});

	it("Falls back to popular papers when personalized caches are empty", async () => {
		fetchUserInteractionsCount.mockResolvedValue({ num_interactions: 12 });

		fetchContentRecommendations.mockResolvedValue([]);
		fetchUserRecommendations.mockResolvedValue([]);
		fetchTopicRecommendations.mockResolvedValue([]);
		fetchPopularRecommendations.mockResolvedValue(popularPapers);

		const result = await getHomeRecommendations(42);

		expect(result).toEqual({
			authenticated: true,
			sections: [
				{
					header: "Popular papers",
					papers: popularPapersDTO
				}
			]
		});
	});

	it("returns content-based and popular sections for users with fewer than 3 interactions", async () => {
		fetchUserInteractionsCount.mockResolvedValue({
			num_interactions: 2
		});

		fetchContentRecommendations.mockResolvedValue(contentBasedRecoms);
		fetchUserRecommendations.mockResolvedValue([]);
		fetchTopicRecommendations.mockResolvedValue([]);
		fetchPopularRecommendations.mockResolvedValue(popularPapers);

		const result = await getHomeRecommendations(42);

		expect(result.sections).toEqual([
			{
				header: "Because you viewed",
				papers: contentBasedRecomsDTO
			},
			{
				header: "Popular papers",
				papers: popularPapersDTO
			}
		]);
	});

	it("Returns content, topic and popular sections for users with 3 to 9 interactions", async () => {
		fetchUserInteractionsCount.mockResolvedValue({ num_interactions: 5 });

		fetchContentRecommendations.mockResolvedValue(contentBasedRecoms);
		fetchUserRecommendations.mockResolvedValue(userBasedRecoms);
		fetchTopicRecommendations.mockResolvedValue(topicBasedRecoms);
		fetchPopularRecommendations.mockResolvedValue(popularPapers);

		const result = await getHomeRecommendations(42);

		expect(result.sections).toEqual([
			{
				header: "Based on your interests",
				papers: contentBasedRecomsDTO
			},
			{
				header: "Explore your research topics",
				papers: topicBasedRecomsDTO
			},
			{
				header: "Popular papers",
				papers: popularPapersDTO
			}
		]);
	});

	it("Returns content, collaborative and topic sections for users with at least 10 interactions", async () => {
		fetchUserInteractionsCount.mockResolvedValue({
			num_interactions: 10
		});

		fetchContentRecommendations.mockResolvedValue(contentBasedRecoms);
		fetchUserRecommendations.mockResolvedValue(userBasedRecoms);
		fetchTopicRecommendations.mockResolvedValue(topicBasedRecoms);
		fetchPopularRecommendations.mockResolvedValue(popularPapers);

		const result = await getHomeRecommendations(42);

		expect(result.sections).toEqual([
			{
				header: "Based on your interests",
				papers: contentBasedRecomsDTO
			},
			{
				header: "Researchers with similar interests also viewed",
				papers: userBasedRecomsDTO
			},
			{
				header: "Explore your research topics",
				papers: topicBasedRecomsDTO
			},
			
		]);
	});

});


describe("getPopularRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns paginated popular recommendations", async () => {
		fetchPopularRecommendations.mockResolvedValue(popularPapers);

		const result = await getPopularRecommendations(2, 2);

		expect(fetchPopularRecommendations).toHaveBeenCalledWith(2,2);
		expect(fetchPopularRecommendations).toHaveBeenCalledTimes(1);

		expect(result).toEqual(popularPapers);
	});

	it("Throws 400 when page is invalid", async () => {
		await expect(getPopularRecommendations(0, 10))
			.rejects
			.toThrow("'page' must be greater than or equal to 1");

		expect(fetchPopularRecommendations).not.toHaveBeenCalled();
	});

	it("Throws 400 when limit is invalid", async () => {
		await expect(getPopularRecommendations(1, 101))
			.rejects
			.toThrow("'limit' must be between 1 and 100");

		expect(fetchPopularRecommendations).not.toHaveBeenCalled();
	});

	
});

describe("getContentRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns paginated content-based recommendations", async () => {
		fetchContentRecommendations.mockResolvedValue(contentBasedRecoms);

		const result = await getContentRecommendations(81, 2, 4);

		expect(fetchContentRecommendations).toHaveBeenCalledWith(81,4,4);
		expect(fetchContentRecommendations).toHaveBeenCalledTimes(1);

		expect(result).toEqual(contentBasedRecoms);
	});

	it("Throws 400 when authenticated recommendation getter receives an invalid user id", async () => {
		await expect(getContentRecommendations("invalid", 1, 10)).rejects.toThrow();

		expect(fetchContentRecommendations).not.toHaveBeenCalled();
	});
});
	
describe("getUserRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns paginated user-based recommendations", async () => {
		fetchUserRecommendations.mockResolvedValue(userBasedRecoms);

		const result = await getUserRecommendations(81,2,3);

		expect(fetchUserRecommendations).toHaveBeenCalledWith(81,3,3);
		expect(fetchUserRecommendations).toHaveBeenCalledTimes(1);

		expect(result).toEqual(userBasedRecoms);
	});
});


describe("getTopicRecommendations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("Returns paginated topic-based recommendations", async () => {
		fetchTopicRecommendations.mockResolvedValue(topicBasedRecoms);

		const result = await getTopicRecommendations(81, 2, 2);

		expect(fetchTopicRecommendations).toHaveBeenCalledWith(81,2,2);
		expect(fetchTopicRecommendations).toHaveBeenCalledTimes(1);

		expect(result).toEqual(topicBasedRecoms);
	});
});