import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/db.js", () => ({
    default: {
        query: vi.fn()
    }
}));

import pool from "../../../src/config/db.js";

import {
    fetchUserTotalViewedPapers,
    fetchUserRecentlyViewedPapers,
    fetchUserTotalSavedPapers,
    fetchUserRecentlySavedPapers,
    fetchUserTotalFolders,
    fetchUserFoldersPreview,
    fetchFolderPapersPreview,
    fetchUserFollowedAuthors,
    fetchUserTopResearchTopics
} from "../../../src/repositories/profileRepository.js";


const viewedPaperPreview = [
    {
		openalex_id: "W3131053508",
		id: "831991",
		title: "Machine Learning Foundations",
		primary_topic_display_name: "Advanced Statistical Modeling Techniques",
		author_count: "1",
		authors_preview: [
			{ id: "A5049496911", name: "Taeho Jo" }
		]
	},
	{
		openalex_id: "W4414630450",
		id: "664827",
		title: "Physics Driven Image Simulation from Commercial Satellite Imagery",
		primary_topic_display_name: "Distributed and Parallel Computing Systems",
		author_count: "6",
		authors_preview: [
			{ id: "A5021824018", name: "Scott Sorensen" },
			{ id: "A5055427426", name: "Wayne Treible" }
		]
	},
	{
		openalex_id: "W2093815829",
		id: "407633",
		title: "XtremWeb: Building an Experimental Platform for Global Computing",
		primary_topic_display_name: "Parallel Computing and Optimization Techniques",
		author_count: "4",
		authors_preview: [
			{ id: "A5036547514", name: "Cécile Germain" },
			{ id: "A5019222358", name: "Vincent Néri" }
		]
	},
	{
		openalex_id: "W2167109125",
		id: "832856",
		title: "Early power exploration---a World Wide Web application",
		primary_topic_display_name: "Parallel Computing and Optimization Techniques",
		author_count: "2",
		authors_preview: [
			{ id: "A5109342511", name: "D.B. Lidsky" },
			{ id: "A5088933304", name: "Jan M. Rabaey" }
		]
	}
];

const savedPaperPreview = [
    {
		openalex_id: "W4238334784",
		id: "540714",
		title: "Inductance 101: modeling and extraction",
		primary_topic_display_name: "Sensor Technology and Measurement Systems",
		author_count: "2",
		authors_preview: [
			{ id: "A5088389671", name: "M.W. Beattie" },
			{ id: "A5031274783", name: "L.T. Pileggi" }
		]
	},
	{
		openalex_id: "W1792598830",
		id: "543206",
		title: "Ignition System Integrated AC Ion Current Sensing for Robust and Reliable Online Engine Control",
		primary_topic_display_name: "Sensor Technology and Measurement Systems",
		author_count: "6",
		authors_preview: [
			{ id: "A5088973431", name: "H. Wilstermann" },
			{ id: "A5057324886", name: "Andthomas D. Greiner" }
		]
	},
	{
		openalex_id: "W1986328299",
		id: "94747",
		title: "Low-storage Runge-Kutta schemes",
		primary_topic_display_name: "Advanced Data Storage Technologies",
		author_count: "1",
		authors_preview: [
			{ id: "A5060027329", name: "John Williamson" }
		]
	},
	{
		openalex_id: "W2157840548",
		id: "388028",
		title: "Physics at the CLIC e+e- Linear Collider -- Input to the Snowmass process 2013",
		primary_topic_display_name: "Distributed and Parallel Computing Systems",
		author_count: "88",
		authors_preview: [
			{ id: "A5065829244", name: "H. Abramowicz" },
			{ id: "A5056881719", name: "A. C. Abusleme Hoffman" }
		]
	}
];

const folderPreview = [
    { id: 179, name: "Computer Networks and Communications Reading List", paper_count: 10, color: "orange" }
];

const researchTopics = [
    { id: "T10715", name: "Distributed and Parallel Computing Systems", score: 0.196244 },
	{ id: "T10054", name: "Parallel Computing and Optimization Techniques", score: 0.134728 },
	{ id: "T11986", name: "Scientific Computing and Data Management", score: 0.119989 },
	{ id: "T11181", name: "Advanced Data Storage Technologies", score: 0.092942 },
	{ id: "T11937", name: "Research Data Management Practices", score: 0.039199 },
	{ id: "T12564", name: "Sensor Technology and Measurement Systems", score: 0.035938 },
	{ id: "T12859", name: "Cell Image Analysis Techniques", score: 0.029329 },
	{ id: "T12692", name: "Magnetic Field Sensors Techniques", score: 0.027425 }
];

// Providing a representative test for each function in the profile repository

describe("fetchUserTotalViewedPapers", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

    it("Returns the total number of paper views for the user", async () => {
        const row = { total_viewed_papers: 288 };

        pool.query.mockResolvedValue({ rows: [row] });

        const result = await fetchUserTotalViewedPapers(42);

        expect(pool.query).toHaveBeenCalledTimes(1);

        const [query, params] = pool.query.mock.calls[0];

        
		expect(query).toContain("SELECT COALESCE(SUM(view_count), 0)::integer AS total_viewed_papers");
		expect(query).toContain("FROM user_paper_interactions");
		expect(query).toContain("WHERE user_id = $1");
		expect(query).toContain("AND view_count > 0;");
        
		expect(params).toEqual([42]);

        expect(result).toEqual(row);
    });
});

describe("fetchUserRecentlyViewedPapers", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

    it("Returns the 4 most recently viewed papers", async () => {
        pool.query.mockResolvedValue({
            rows: viewedPaperPreview
        });

        const result = await fetchUserRecentlyViewedPapers(42);

        const [query, params] = pool.query.mock.calls[0];

		// Validating the parts of the query that are unique to this repository,
		// since the rest are common to the search repository query (paper fields, join with paper_authors, etc.)
        expect(query).toContain("upi.view_count > 0");
        expect(query).toContain("ORDER BY upi.last_interaction_at DESC");
        expect(query).toContain("LIMIT 4");

        expect(params).toEqual([42]);

        expect(result).toEqual(viewedPaperPreview);
    });
});


describe("fetchUserTotalSavedPapers", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

    it("Returns the number of saved papers for the user", async () => {
        const row = { total_saved_papers: "10" };

        pool.query.mockResolvedValue({ rows: [row] });

        const result = await fetchUserTotalSavedPapers(42);

        const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("SELECT COUNT(*) AS total_saved_papers");
		expect(query).toContain("FROM user_paper_interactions");
		expect(query).toContain("WHERE user_id = $1");
		expect(query).toContain("AND is_saved = true;");

        expect(params).toEqual([42]);

        expect(result).toEqual(row);
    });
});


describe("fetchUserRecentlySavedPapers", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

    it("Returns the 4 most recently saved papers", async () => {
        pool.query.mockResolvedValue({ rows: savedPaperPreview });

        const result = await fetchUserRecentlySavedPapers(42);

        const [query, params] = pool.query.mock.calls[0];

		// Validating the parts of the query that are unique to this repository,
		// since the rest are common to the search repository query (paper fields, join with paper_authors, etc.)
        expect(query).toContain("upi.is_saved = true");
        expect(query).toContain("ORDER BY upi.last_interaction_at DESC");
        expect(query).toContain("LIMIT 4");

        expect(params).toEqual([42]);

        expect(result).toEqual(savedPaperPreview);
    });
});


describe("fetchUserTotalFolders", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

    it("Returns the number of folders belonging to the user", async () => {
        const row = { total_user_folders: "1" };

        pool.query.mockResolvedValue({ rows: [row] });

        const result = await fetchUserTotalFolders(42);

        const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("SELECT COUNT(*) AS total_user_folders");
		expect(query).toContain("FROM user_folders");
		expect(query).toContain("WHERE user_id = $1;");

        expect(params).toEqual([42]);

        expect(result).toEqual(row);
    });
});


describe("fetchUserFoldersPreview", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

    it("Returns the user's 3 most populated folders", async () => {
        pool.query.mockResolvedValue({ rows: folderPreview });

        const result = await fetchUserFoldersPreview(42);

        const [query, params] = pool.query.mock.calls[0];

		expect(query).toContain("SELECT id, name, paper_count, color");
        expect(query).toContain("FROM user_folders");
        expect(query).toContain("WHERE user_id = $1");
		expect(query).toContain("ORDER BY paper_count DESC, updated_at DESC, id ASC");
		expect(query).toContain("LIMIT 3;");

        expect(params).toEqual([42]);

        expect(result).toEqual(folderPreview);
    });
});


describe("fetchFolderPapersPreview", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

    it("Returns the 2 most recent papers from a folder owned by the user", async () => {
        pool.query.mockResolvedValue({ rows: viewedPaperPreview.slice(0, 2) });

        const result = await fetchFolderPapersPreview(42, 179);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("uf.user_id = $1");
        expect(query).toContain("ufp.folder_id = $2");
        expect(query).toContain("ORDER BY ufp.added_at DESC");
        expect(query).toContain("LIMIT 2");

        expect(params).toEqual([42, 179]);

        expect(result).toEqual(viewedPaperPreview.slice(0, 2));
    });
});


describe("fetchUserFollowedAuthors", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

    it("Returns the authors followed by the user", async () => {
        pool.query.mockResolvedValue({ rows: [] });

        const result = await fetchUserFollowedAuthors(42);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("FROM user_follows_authors");
        expect(query).toContain("WHERE ufa.user_id = $1");
        expect(query).toContain("ORDER BY ufa.created_at DESC");

        expect(params).toEqual([42]);
        expect(result).toEqual([]);
    });
});


describe("fetchUserTopResearchTopics", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

    it("Returns the top research topics ordered by preference score", async () => {
        pool.query.mockResolvedValue({ rows: researchTopics });

        const result = await fetchUserTopResearchTopics(42);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("jsonb_each_text(upp.topic_preferences)");
        expect(query).toContain("ORDER BY pref.score DESC");
        expect(query).toContain("LIMIT $2");

        expect(params).toEqual([42, 8]);
        expect(result).toEqual(researchTopics);
    });

	it("Uses a custom research topic limit", async () => {
		pool.query.mockResolvedValue({ rows: researchTopics});

		await fetchUserTopResearchTopics(42, 5);

		expect(pool.query).toHaveBeenCalledWith(expect.any(String), [42, 5]);
	});
});