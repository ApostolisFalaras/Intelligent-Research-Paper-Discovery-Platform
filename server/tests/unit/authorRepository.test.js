import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB pool's query method the queries the PostgreSQL DB for a paper with a particular id
vi.mock("./../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    },
}));

// Import after to replace the real function with the mock function
import pool from "../../src/config/db.js";
import { 
    fetchAuthorById,
    fetchAuthorAffiliationsById,
    fetchAuthorLastKnownInstitutionsById,
    fetchAuthorTopicsById,
    fetchAuthorTopicSharesById,
    fetchAuthorCountsByYearById,
    fetchAuthorTop5Papers } from "../../src/repositories/authorRepository.js";


const mockResolvedAuthor = {
    id: "50703",
    openalex_id: "A5107860229",
    orcid: null,
    display_name: "I. Badhrees",
    raw_author_names: [ "Badhrees, I.", "I Badhrees", "I. Badhrees" ],
    full_name: "Badhrees, I.",
    works_count: 190,
    cited_by_count: 5775,
    two_year_mean_citedness: 0,
    h_index: 34,
    i10_index: 99,
    works_api_url: "https://api.openalex.org/works?filter=author.id:A5107860229",
    openalex_created_at: new Date("2016-06-23T21:00:00.000Z"),
    openalex_updated_at: new Date("2026-06-02T09:25:25.000Z"),
};  

// Mocking 2/12 author affiliations for simplicity
const mockResolvedPaperAuthorAffiliations = [
    {
        institution_openalex_id: "I4210161779",
        institution_ror: "https://ror.org/05stzyr92",
        institution_display_name: "Campbell Collaboration",
        institution_country_code: "NO",
        institution_type: "nonprofit",
        lineage: [ "https://openalex.org/I4210161779" ],
        years: [ 2018, 2016 ]
    },
    {
        institution_openalex_id: "I67031392",
        institution_ror: "https://ror.org/02qtvee93",
        institution_display_name: "Carleton University",
        institution_country_code: "CA",
        institution_type: "education",
        lineage: [ "https://openalex.org/I67031392" ],
        years: [ 2023, 2022, 2021, 2020, 2019, 2018, 2017 ]
    }
];

// For this particular author, the last known institutions field is an empty list,
// But if it had fields, it follows the same structure as "affiliations" without they "years" fields
// However, to test successfull retrieval of last known institutions, 
// I use the above affiliation structures
const mockResolvedAuthorInstitutions = [
    {
        institution_openalex_id: "I4210161779",
        institution_ror: "https://ror.org/05stzyr92",
        institution_display_name: "Campbell Collaboration",
        institution_country_code: "NO",
        institution_type: "nonprofit",
        lineage: [ "https://openalex.org/I4210161779" ]
    },
    {
        institution_openalex_id: "I67031392",
        institution_ror: "https://ror.org/02qtvee93",
        institution_display_name: "Carleton University",
        institution_country_code: "CA",
        institution_type: "education",
        lineage: [ "https://openalex.org/I67031392" ]
    }
];

// Mocking 2/5 topics associated with the current author for simplicity
const mockResolvedAuthorTopics = [
    {
        topic_openalex_id: "T10048",
        topic_display_name: "Particle physics theoretical and experimental studies",
        works_count: 151,
        domain_openalex_id: "3",
        domain_display_name: "Physical Sciences",
        field_openalex_id: "31",
        field_display_name: "Physics and Astronomy",
        subfield_openalex_id: "3106",
        subfield_display_name: "Nuclear and High Energy Physics"
    },
    {
        topic_opeanlex_id: "T10224",
        topic_display_name: "Quantum Chromodynamics and Particle Interactions",
        works_count: 129,
        domain_openalex_id: "3",
        domain_display_name: "Physical Sciences",
        field_openalex_id: "31",
        field_display_name: "Physics and Astronomy",
        subfield_openalex_id: "3106",
        subfield_display_name: "Nuclear and High Energy Physics"
    }
];

// Mocking 2/5 author topic shares for simplicity
const mockResolvedAuthorTopicShares = [
    {
        topic_openalex_id: "T10527",
        topic_display_name: "High-Energy Particle Collisions Research",
        value: 0.00035,
        domain_openalex_id: "3",
        domain_display_name: "Physical Sciences",
        field_openalex_id: "31",
        field_display_name: "Physics and Astronomy",
        subfield_openalex_id: "3106",
        subfield_display_name: "Nuclear and High Energy Physics"
    },
    {
        topic_openalex_id: "T10224",
        topic_display_name: "Quantum Chromodynamics and Particle Interactions",
        value: 0.000327,
        domain_openalex_id: "3",
        domain_display_name: "Physical Sciences",
        field_openalex_id: "31",
        field_display_name: "Physics and Astronomy",
        subfield_openalex_id: "3106",
        subfield_display_name: "Nuclear and High Energy Physics"
    },
];

// Mocking 2/15 author citation counts by year for simplicity
const mockResolvedAuthorCountsByYear = [
    {
        year: 2025,
        works_count: 1,
        oa_works_count: 1,
        cited_by_count: 0
    },
    {
        year: 2023,
        works_count: 3,
        oa_works_count: 3,
        cited_by_count: 20
    },
];

const mockResolvedTop5Papers = [
    {
        id: "386866",
        openalex_id: "W2741809807",
        title: "The state of OA: a large-scale analysis of the prevalence and impact of Open Access articles",
        display_name: "The state of OA: a large-scale analysis of the prevalence and impact of Open Access articles",
        abstract: "Despite growing interest in Open Access (OA) to scholarly literature, ...",
        publication_year: 2018,
        cited_by_count: 1193,
        fwci: 490.1635,
        primary_source_display_name: "PeerJ",
        primary_topic_display_name: "scientometrics and bibliometrics research",
        is_open_access: true,
        open_access_status: "gold",
        author_count: 9,
        authors_preview: [
            { id: "A5048491430", name: "Heather Piwowar" },
            { id: "A5023888391", name: "Jason Priem" }
        ]
    },
    {
        id: "891407",
        openalex_id: "W2046766973",
        title: "Sharing Detailed Research Data Is Associated with Increased Citation Rate",
        display_name: "Sharing Detailed Research Data Is Associated with Increased Citation Rate",
        abstract: "BACKGROUND: Sharing research data provides benefit to the general scientific community, ...",
        publication_year: 2007,
        cited_by_count: 904,
        fwci: 48.0677,
        primary_source_display_name: "PLoS ONE",
        primary_topic_display_name: "Research Data Management Practices",
        is_open_access: true,
        open_access_status: "gold",
        author_count: 3,
        authors_preview: [
            { id: "A5048491430", name: "Heather Piwowar" },
            { id: "A5109883106", name: "Roger Day" }
        ]
    },
    {
        id: "386900",
        openalex_id: "W2045657963",
        title: "Data reuse and the open data citation advantage",
        display_name: "Data reuse and the open data citation advantage",
        abstract: "Background. Attribution to the original contributor upon reuse of published data is important both as a reward for data creators and to document the provenance of research findings. Previous studies have found that ...",
        publication_year: 2013,
        cited_by_count: 614,
        fwci: 92.7518,
        primary_source_display_name: "PeerJ",
        primary_topic_display_name: "Research Data Management Practices",
        is_open_access: true,
        open_access_status: "gold",
        author_count: 2,
        authors_preview: [
            { id: "A5048491430", name: "Heather Piwowar" },
            { id: "A5013911206", name: "Todd Vision" }
        ]
    },
    {
        id: "386943",
        openalex_id: "W1572136682",
        title: "Value all research products",
        display_name: "Value all research products",
        abstract: null,
        publication_year: 2013,
        cited_by_count: 410,
        fwci: 125.3335,
        primary_source_display_name: "Nature",
        primaryT_topic_display_name: "Research Data Management Practices",
        is_open_access: true,
        open_access_status: "bronze",
        author_count: 1,
        authors_preview: [
            { id: "A5048491430", name: "Heather Piwowar" }
        ]
    },
    {
        id: "217473",
        openalex_id: "W1553564559",
        title: "Altmetrics in the wild: Using social media to explore scholarly impact",
        display_name: "Altmetrics in the wild: Using social media to explore scholarly impact",
        abstract: "In growing numbers, scholars are integrating social media tools like blogs, Twitter, and Mendeley into their professional communications. The online, public nature of these tools exposes and reifies scholarly processes once hidden and ephemeral. Metrics based on this activities could inform broader, faster measures of impact, complementing traditional citation metrics. This study explores the properties of these social media-based metrics or \"altmetrics\", sampling 24,331 articles published by the Public Library of Science. We find that that different indicators vary greatly in activity. Around 5% of sampled articles are cited in Wikipedia, while close to 80% have been included in at least one Mendeley library. There is, however, an encouraging diversity; a quarter of articles have nonzero data from five or more different sources. Correlation and factor analysis suggest citation and altmetrics indicators track related but distinct impacts, with neither able to describe the complete picture of scholarly use alone. There are moderate correlations between Mendeley and Web of Science citation, but many altmetric indicators seem to measure impact mostly orthogonal to citation. Articles cluster in ways that suggest five different impact \"flavors\", capturing impacts of different types on different audiences; for instance, some articles may be heavily read and saved by scholars but seldom cited. Together, these findings encourage more research into altmetrics as complements to traditional citation measures.",
        publication_year: 2012,
        cited_by_count: 360,
        fwci: 0,
        primary_source_display_name: "arXiv (Cornell University)",
        primary_topic_display_name: "scientometrics and bibliometrics research",
        is_open_access: true,
        open_access_status: "green",
        author_count: 3,
        authors_preview: [
            { id: "A5023888391", name: "Jason Priem" },
            { id: "A5048491430", name: "Heather Piwowar" }
        ]
    }
];


function expectFetchAuthorQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM authors");
    expect(query).toContain("WHERE openalex_id = $1");
    expect(query).toContain("LIMIT 1;");
} 

describe("fetchAuthorById", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches an author for a valid openalex id", async () => {
        pool.query.mockResolvedValue({
            rows: [
                mockResolvedAuthor
            ],
        });

        // The expected output is essentially the 1st element of the rows field, rows[0]
        const expectedOutput = mockResolvedAuthor;
        
        const result = await fetchAuthorById("A5107860229");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorQuery(query);
        expect(params).toEqual(["A5107860229"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedOutput);
    });

    
    it("Fetches an empty array for an non-existent author id", async () => {
        pool.query.mockResolvedValue({ 
            rows: [], 
        });

        const result = await fetchAuthorById("A5107");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorQuery(query);
        expect(params).toEqual(["A5107"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
    });

    // ------------- DATABASE ERRORS --------------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        const result = await expect(fetchAuthorById("A5107860229")).rejects.toThrow("Unexpected DB error");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorQuery(query);
        expect(params).toEqual(["A5107860229"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
    });
});


function expectFetchPaperAuthorAffiliationsQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM author_affiliations");
    expect(query).toContain("WHERE author_id = $1");
    expect(query).toContain("ORDER BY institution_display_name ASC;");
}

describe("fetchAuthorAffiliationsById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the affiliations associated with the fetched author", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedPaperAuthorAffiliations
        });

        const results = await fetchAuthorAffiliationsById("50703");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchPaperAuthorAffiliationsQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual(mockResolvedPaperAuthorAffiliations);
    });

    it("Fetches an empty array for an invalid internal author id", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const results = await fetchAuthorAffiliationsById("50703");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchPaperAuthorAffiliationsQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual([]);
    });

    // ---------- DB ERROR ----------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchAuthorAffiliationsById("50703"))
        .rejects
        .toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchPaperAuthorAffiliationsQuery(query);
        expect(params).toEqual(["50703"]);
    });
});


function expectFetchAuthorInstitutionsQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM author_last_known_institutions");
    expect(query).toContain("WHERE author_id = $1");
    expect(query).toContain("ORDER BY institution_display_name ASC;");
}


describe("fetchPaperAuthorInstitutions", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the last known institutions associated with the fetched author", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedAuthorInstitutions
        });

        const results = await fetchAuthorLastKnownInstitutionsById("50703");

        const [query, params] = pool.query.mock.calls[0];
        
        expectFetchAuthorInstitutionsQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual(mockResolvedAuthorInstitutions);
    });

    it("Fetches an empry array for an invalid internal author id", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const results = await fetchAuthorLastKnownInstitutionsById("50703");

        const [query, params] = pool.query.mock.calls[0];
        
        expectFetchAuthorInstitutionsQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual([]);
    });

    // ---------- DB ERROR ----------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchAuthorLastKnownInstitutionsById("50703"))
        .rejects
        .toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];
        
        expectFetchAuthorInstitutionsQuery(query);
        expect(params).toEqual(["50703"]);
    });
});

function expectFetchAuthorTopicsQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM author_topics");
    expect(query).toContain("WHERE author_id = $1");
    expect(query).toContain("ORDER BY works_count DESC NULLS LAST;");
}

describe("fetchAuthorTopicsById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the topics associated with the fetched author", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedAuthorTopics
        });

        const results = await fetchAuthorTopicsById("50703");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorTopicsQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual(mockResolvedAuthorTopics);
    });

    it("Fetches an empty array for an invalid internal author id", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const results = await fetchAuthorTopicsById("50703");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorTopicsQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual([]);
    });

    // ---------- DB ERROR ----------

    it("An unexpected database occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchAuthorTopicsById("50703"))
        .rejects
        .toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorTopicsQuery(query);
        expect(params).toEqual(["50703"]);
    });
});

function expectFetchAuthorTopicSharesQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM author_topic_share");
    expect(query).toContain("WHERE author_id = $1");
    expect(query).toContain("ORDER BY value DESC NULLS LAST;");
}

		
describe("fetchPaperTopicSharesById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the topics associated with a particular author", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedAuthorTopicShares
        });

        const results = await fetchAuthorTopicSharesById("50703");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorTopicSharesQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual(mockResolvedAuthorTopicShares);
    });

    it("Fetches an empty array for an invalid internal author id", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const results = await fetchAuthorTopicSharesById("50703");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorTopicSharesQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual([]);
    });

    // ---------- DB ERROR ----------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchAuthorTopicSharesById("50703"))
        .rejects
        .toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorTopicSharesQuery(query);
        expect(params).toEqual(["50703"]);
    });
});

function expectFetchAuthorCountsByYearQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM author_counts_by_year");
    expect(query).toContain("WHERE author_id = $1");
    expect(query).toContain("ORDER BY year DESC;");        
}


describe("fetchAuthorCountsByYear", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the citation counts by year associated with a particular author", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedAuthorCountsByYear
        });

        const results = await fetchAuthorCountsByYearById("50703");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorCountsByYearQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual(mockResolvedAuthorCountsByYear);
    });

    it("Fetches an empty array for an invalid internal author id", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const results = await fetchAuthorCountsByYearById("50703");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorCountsByYearQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual([]);
    });

    // ---------- DB ERROR ----------
    
    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchAuthorCountsByYearById("50703"))
        .rejects
        .toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorCountsByYearQuery(query);
        expect(params).toEqual(["50703"]);
    });
});


function expectFetchAuthorTop5PapersQuery(query) {
    expect(query).toContain("SELECT");
    expect(query).toContain("FROM papers p");
    expect(query).toContain("JOIN paper_authors pa_target");
    expect(query).toContain("ON pa_target.paper_id = p.id");
    expect(query).toContain("LEFT JOIN paper_authors pa_all");
    expect(query).toContain("ON pa_all.paper_id = p.id");
    expect(query).toContain("WHERE pa_target.author_id = $1");
    expect(query).toContain("GROUP BY p.id");
    expect(query).toContain("ORDER BY p.cited_by_count DESC NULLS LAST");
    expect(query).toContain("LIMIT 5;");
}

describe("fetchAuthorTop5Papers", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the top 5 top papers associated with a particular author", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedTop5Papers
        });

        const results = await fetchAuthorTop5Papers("50703");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorTop5PapersQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual(mockResolvedTop5Papers);
    });

    it("Fetches an empty array for an invalid internal author id", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const results = await fetchAuthorTop5Papers("50703");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorTop5PapersQuery(query);
        expect(params).toEqual(["50703"]);

        expect(results).toEqual([]);
    });

    // ---------- DB ERROR ----------
    
    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchAuthorTop5Papers("50703"))
        .rejects
        .toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorTop5PapersQuery(query);
        expect(params).toEqual(["50703"]);
    });
});