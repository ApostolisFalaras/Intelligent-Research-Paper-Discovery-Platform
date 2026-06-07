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
    fetchAuthorCountsByYearById } from "../../src/repositories/authorRepository.js";


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