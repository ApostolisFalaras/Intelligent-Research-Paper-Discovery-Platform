import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB pool's query method the queries the PostgreSQL DB for a paper with a particular id
vi.mock("../../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    },
}));

// Import after to replace the real function with the mock function
import pool from "../../../src/config/db.js";
import { 
    fetchPaperById,
    fetchPaperAuthorsById,
    fetchPaperAuthorInstitutionsById,
    fetchPaperAuthorAffiliationsById,
    fetchPaperTopicsById,
    fetchPaperKeywordsById,
    fetchPaperLocationsById,
    fetchPaperReferencesById,
    fetchPaperRelatedById,
    fetchPaperCountsByYearById } from "../../../src/repositories/paperRepository.js";


const mockResolvedPaper = {
    id: "386866",
    openalex_id: "W2741809807",
    doi: "https://doi.org/10.7717/peerj.4375",
    title: "The state of OA: a large-scale analysis of the prevalence and impact of Open Access articles",
    display_name: "The state of OA: a large-scale analysis of the prevalence and impact of Open Access articles",
    abstract: "Despite growing interest in Open Access...",
    publication_year: 2018,
    publication_date: new Date("2018-02-12T22:00:00.000Z"),
    language: "en",
    paper_type: "book-chapter",
    cited_by_count: 1193,
    fwci: "490.1635",
    citation_normalized_percentile_value: "1.0000",
    citation_top_1_percent: true,
    citation_top_10_percent: true,
    cited_by_percentile_year_min: 99,
    cited_by_percentile_year_max: 100,
    referenced_works_count: 54,

    primary_source_openalex_id: "S1983995261",
    primary_source_display_name: "PeerJ",
    primary_source_type: "journal",
    biblio_volume: "6",
    biblio_issue: null,
    biblio_first_page: "e4375",
    biblio_last_page: "e4375",

    primary_topic_openalex_id: "T10102",
    primary_topic_display_name: "scientometrics and bibliometrics research",
    primary_domain_openalex_id: "2",
    primary_domain_display_name: "Social Sciences",
    primary_field_openalex_id: "18",
    primary_field_display_name: "Decision Sciences",
    primary_subfield_openalex_id: "1804",
    primary_subfield_display_name: "Statistics, Probability and Uncertainty",

    locations_count: 9,
    countries_distinct_count: 2,
    institutions_distinct_count: 9,

    is_open_access: true,
    open_access_status: "gold",
    open_access_best_url: "https://doi.org/10.7717/peerj.4375",
    open_access_any_repo_has_fulltext: true,
    has_fulltext: false,
    has_content_pdf: false,
    has_content_grobid_xml: false,

    indexed_in: ["crossref", "datacite", "doaj", "pubmed"],

    is_retracted: false,
    is_paratext: false,
    openalex_created_at: new Date("2025-10-09T21:00:00.000Z"),
    openalex_updated_at: new Date("2026-04-26T05:31:28.666Z"),
};


// Mocking 2/9 authors for the above paper for simplicity
const mockResolvedPaperAuthors = [
    {
        id: "1961221",
        author_openalex_id: "A5048491430",
        author_orcid: "https://orcid.org/0000-0003-1613-5981",
        paper_id: "386866",
        author_id: null,
        author_display_name: "Heather Piwowar",
        raw_author_name: "Heather Piwowar",
        author_order: 1,
        author_position: "first",
        is_corresponding: true
    },
    {
        id: "1961222",
        author_openalex_id: "A5023888391",
        author_orcid: "https://orcid.org/0000-0001-6187-6610",
        paper_id: "386866",
        author_id: null,
        author_display_name: "Jason Priem",
        raw_author_name: "Jason Priem",
        author_order: 2,
        author_position: "middle",
        is_corresponding: false
    },
];

// Mocking institutions associated only with the 1st of 9 authors for simplicity
const mockResolvedPaperInstitutions = [
    {
        id: "2195153",
        paper_author_id: "1961221",
        institution_openalex_id: "I4200000001",
        institution_ror: "https://ror.org/02nr0ka47",
        institution_display_name: "OpenAlex",
        country_code: "CA",
        institution_type: "nonprofit",
        lineage: [ "I4200000001" ]
    },
    {
        id: "2195154",
        paper_author_id: "1961221",
        institution_openalex_id: "I4210166736",
        institution_ror: "https://ror.org/05ppvf150",
        institution_display_name: "Impact Technology Development (United States)",
        country_code: "US",
        institution_type: "company",
        lineage: [ "I4210166736" ]
    }
];

// Mocking institutions associated only with the 1st of 9 authors for simplicity
const mockResolvedPaperAffiliations = [
    {
        id: "2375862",
        paper_author_id: "1961221",
        raw_affiliation_string: "Impactstory, Sanford, NC, USA",
        institution_ids: [ "I4210166736", "I4200000001" ]
    },
];

// Mocking 1/3 paper topics for simplicity 
const mockResolvedTopics = [
    {
        id: "1108100",
        topic_openalex_id: "T10102",
        paper_id: "386866",
        topic_id: "8572",
        topic_display_name: "scientometrics and bibliometrics research",
        score: 0.9969000220298767,
        domain_openalex_id: "2",
        domain_display_name: "Social Sciences",
        field_openalex_id: "18",
        field_display_name: "Decision Sciences",
        subfield_openalex_id: "1804",
        subfield_display_name: "Statistics, Probability and Uncertainty",
        is_primary_topic: true
    }
];

// Mocking 4/16 keywords associated with the current paper for simplicity
const mockResolvedKeywords = [
    {
        id: "3974382",
        keyword_openalex_id: "citation",
        keyword_display_name: "Citation",
        score: 0.6881897449493408
    },
    {
        id: "3974383",
        keyword_openalex_id: "license",
        keyword_display_name: "License",
        score: 0.591956377029419
    },
    {
        id: "3974384",
        keyword_openalex_id: "scholarly-communication",
        keyword_display_name: "Scholarly communication",
        score: 0.5683152079582214
    },
    {
        id: "3974385",
        keyword_openalex_id: "web-of-science",
        keyword_display_name: "Web of science",
        score: 0.5055372714996338
    }
];

// Mocking 1/9 of locations
const mockResolvedLocations = [
    {
        id: "850892",
        location_openalex_id: "doi:10.7717/peerj.4375",
        is_oa: true,
        landing_page_url: "https://doi.org/10.7717/peerj.4375",
        pdf_url: null,
        source_openalex_id: "S1983995261",
        source_display_name: "PeerJ",
        source_issn_l: "2167-8359",
        source_issn: [ "2167-8359" ],
        source_is_oa: true,
        source_is_in_doaj: true,
        source_is_core: true,
        source_host_organization: "P4310320104",
        source_host_organization_name: "PeerJ, Inc.",
        source_host_organization_lineage: [ "P4310320104" ],
        source_type: "journal",
        license_id: "https://openalex.org/licenses/cc-by",
        license: "cc-by",
        version: "publishedVersion",
        is_accepted: true,
        is_published: true,
        raw_source_name: "PeerJ",
        raw_type: "journal-article",
        is_primary: true,
        is_best_oa: true
    }
];

// Mocking 3/54 related papers
const mockResolvedReferences = [
    {
        id: "13534450",
        referenced_work_openalex_id: "W1560783210",
    },
    {
        id: "13534451",
        referenced_work_openalex_id: "W1724212071",
    },
    {
        id: "13534452",
        referenced_work_openalex_id: "W1767272795",
    }
];

// Mocking 3/10 related papers
const mockResolvedRelated = [
    {
        id: "3136587",
        related_work_openalex_id: "W2294604317",
    },
    {
        id: "3136588",
        related_work_openalex_id: "W2060904856",
    },
    {
        id: "3136589",
        related_work_openalex_id: "W2086473138",
    }
];

const mockResolvedCountByYear = [
    {
        id: "3316206",
        year: 2026,
        cited_by_count: 56
    },
    {
        id: "3316207",
        year: 2025,
        cited_by_count: 135
    }
];


function expectFetchPaperQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM papers");
    expect(query).toContain("WHERE openalex_id = $1");
    expect(query).toContain("LIMIT 1;");
} 

describe("fetchPaperById", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches a paper for a valid openalex id", async () => {
        pool.query.mockResolvedValue({
            rows: [
                mockResolvedPaper
            ],
        });

        // The expected output is essentially the 1st element of the rows field, rows[0]
        const expectedOutput = mockResolvedPaper;
        
        const result = await fetchPaperById("W2741809807");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchPaperQuery(query);
        expect(params).toEqual(["W2741809807"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedOutput);
    });

    
    it("Fetches an empty array for an non-existent openalex id", async () => {
        pool.query.mockResolvedValue({ 
            rows: [], 
        });

        const result = await fetchPaperById("W123");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchPaperQuery(query);
        expect(params).toEqual(["W123"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
    });

    // ------------- DATABASE ERRORS --------------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        const result = await expect(fetchPaperById("W2741809807")).rejects.toThrow("Unexpected DB error");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchPaperQuery(query);
        expect(params).toEqual(["W2741809807"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
    });
});


describe("fetchPaperAuthorsById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the authors associated with a particular paper", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedPaperAuthors
        });

        const results = await fetchPaperAuthorsById("386866");

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM paper_authors");
        expect(query).toContain("WHERE paper_id = $1");
        expect(query).toContain("ORDER BY author_order ASC;");
        expect(params).toEqual(["386866"]);

        expect(results).toEqual(mockResolvedPaperAuthors);
    });
});


describe("fetchPaperAuthorInstitutions", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the institutions associated with the authors that correspond to a particular paper", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedPaperInstitutions
        });

        const results = await fetchPaperAuthorInstitutionsById("386866");

        const [query, params] = pool.query.mock.calls[0];
        
        expect(query).toContain("SELECT pai.*");
        expect(query).toContain("FROM paper_author_institutions pai");
        expect(query).toContain("JOIN paper_authors pa");
        expect(query).toContain("ON pai.paper_author_id = pa.id");
        expect(query).toContain("WHERE pa.paper_id = $1;");
        expect(params).toEqual(["386866"]);

        expect(results).toEqual(results);
    });
});


describe("fetchPaperAuthorAffiliations", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the affiliations associated with the authors that correspond to a particular paper", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedPaperAffiliations
        });

        const results = await fetchPaperAuthorAffiliationsById("386866");

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT paf.*");
        expect(query).toContain("FROM paper_author_affiliations paf");
        expect(query).toContain("JOIN paper_authors pa");
        expect(query).toContain("ON paf.paper_author_id = pa.id");
        expect(query).toContain("WHERE pa.paper_id = $1;");
        expect(params).toEqual(["386866"]);

        expect(results).toEqual(mockResolvedPaperAffiliations);
    });
});


describe("fetchPaperTopics", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the topics associated with a particular paper", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedTopics
        });

        const results = await fetchPaperTopicsById("386866");

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM paper_topics");
        expect(query).toContain("WHERE paper_id = $1");
        expect(query).toContain("ORDER BY is_primary_topic DESC, score DESC NULLS LAST;");
        expect(params).toEqual(["386866"]);

        expect(results).toEqual(mockResolvedTopics);
    });
});


describe("fetchPaperKeywords", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the keywords associated with a particular paper", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedKeywords
        });

        const results = await fetchPaperKeywordsById("386866");

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM paper_keywords");
        expect(query).toContain("WHERE paper_id = $1");
        expect(query).toContain("ORDER BY score DESC NULLS LAST;");
        expect(params).toEqual(["386866"]);

        expect(results).toEqual(mockResolvedKeywords);
    });
});


describe("fetchPaperLocations", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the locations associated with a particular paper", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedLocations
        });

        const results = await fetchPaperLocationsById("386866");

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM paper_locations");
        expect(query).toContain("WHERE paper_id = $1");
        expect(query).toContain("ORDER BY is_best_oa DESC, is_primary DESC;");
        expect(params).toEqual(["386866"]);

        expect(results).toEqual(mockResolvedLocations);
    });
});


describe("fetchPaperReferences", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the references associated with a particular paper", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedReferences
        });

        const results = await fetchPaperReferencesById("386866");

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM paper_references");
        expect(query).toContain("WHERE paper_id = $1;");
        expect(params).toEqual(["386866"]);

        expect(results).toEqual(mockResolvedReferences);
    });
});


describe("fetchPaperRelated", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });


    it("Fetches the related paper ids associated with a particular paper", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedRelated
        });

        const results = await fetchPaperRelatedById("386866");

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM paper_related");
        expect(query).toContain("WHERE paper_id = $1;");
        expect(params).toEqual(["386866"]);

        expect(results).toEqual(mockResolvedRelated);
    });
});


describe("fetchPaperCountsByYear", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the citation counts by year associated with a particular paper", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedCountByYear
        });

        const results = await fetchPaperCountsByYearById("386866");

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM paper_counts_by_year");
        expect(query).toContain("WHERE paper_id = $1");
        expect(query).toContain("ORDER BY year DESC;");   
        expect(params).toEqual(["386866"]);

        expect(results).toEqual(mockResolvedCountByYear);
    });
});