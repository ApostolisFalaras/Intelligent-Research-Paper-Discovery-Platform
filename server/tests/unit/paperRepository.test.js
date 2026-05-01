import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB pool's query method the queries the PostgreSQL DB for a paper with a particular id
vi.mock("./../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    },
}));

// Import after to replace the real function with the mock function
import pool from "./../../src/config/db.js";
import { fetchPaperById } from "./../../src/repositories/paperRepository.js";

describe("fetchPaperById", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("Queries the 'papers' table and returns null for an non-existent openalex id", async () => {
        pool.query.mockResolvedValue({ 
            rows: [], 
        });

        const result = await fetchPaperById("W123");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM papers");
        expect(query).toContain("WHERE openalex_id = $1");
        expect(query).toContain("LIMIT 1;");
        expect(params).toEqual(["W123"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
    });

    it("Queries the 'papers' table and returns the paper for a valid openalex id", async () => {
        pool.query.mockResolvedValue({
            rows: [
                {
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
                },
            ],
        });

        // The expected output is essentially the 1st element of the rows field, rows[0]
        const expectedOutput = {
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

        const result = await fetchPaperById("W2741809807");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM papers");
        expect(query).toContain("WHERE openalex_id = $1");
        expect(query).toContain("LIMIT 1;");
        expect(params).toEqual(["W2741809807"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedOutput);
    });
});