import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository function the fetches a paper by id
vi.mock("./../../src/repositories/paperRepository.js", () => ({
    fetchPaperById: vi.fn(),
}));

// Import after to replace the real function with the mock function
import { fetchPaperById } from "./../../src/repositories/paperRepository.js";
import { getPaperById } from "./../../src/services/paperService.js";


describe("getPaperById", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("Returns null when paper doesn't exist", async () => {
        fetchPaperById.mockResolvedValue(null);

        // Testing invalid paper ID input
        const result = await getPaperById("W123");
        
        expect(fetchPaperById).toHaveBeenCalledWith("W123");
        expect(fetchPaperById).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
    });

    it("Returns a paper and maps it to a formatted paper DTO", async () => {
        fetchPaperById.mockResolvedValue({
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
            indexed_in: [ "crossref", "datacite", "doaj", "pubmed" ],
            is_retracted: false,
            is_paratext: false,
            openalex_created_at: new Date("2025-10-09T21:00:00.000Z"),
            openalex_updated_at: new Date("2026-04-26T05:31:28.666Z")
        });
        
        const result = await getPaperById("W2741809807");

        const expectedOutput = {
            id: "W2741809807",
            internalId: "386866",
            doi: "https://doi.org/10.7717/peerj.4375",
            title: "The state of OA: a large-scale analysis of the prevalence and impact of Open Access articles",
            displayName: "The state of OA: a large-scale analysis of the prevalence and impact of Open Access articles",
            abstract: "Despite growing interest in Open Access...",
            publication: {
                year: 2018,
                date: "2018-02-12",
                type: "book-chapter",
                language: "en"
            },
            source: {
                id: "S1983995261",
                name: "PeerJ",
                type: "journal",
                volume: "6",
                issue: null,
                pages: "e4375"
            },
            "topic": {
                id: "T10102",
                name: "scientometrics and bibliometrics research",
                domain: "Social Sciences",
                field: "Decision Sciences",
                subfield: "Statistics, Probability and Uncertainty"
            },
            metrics: {
                citedByCount: 1193,
                fwci: 490.1635,
                citationPercentile: 1,
                top1Percent: true,
                top10Percent: true,
                referencedWorksCount: 54
            },
            access: {
                isOpenAccess: true,
                status: "gold",
                bestURL: "https://doi.org/10.7717/peerj.4375",
                anyRepoHasFullText: true,
                hasFullText: false,
                hasPDF: false,
                hasGrobIdXML: false
            },
            indexedIn: [
                "crossref",
                "datacite",
                "doaj",
                "pubmed"
            ],
            flags: {
                isRetracted: false,
                isParatext: false
            },
            metadata: {
                openalexCreatedAt: new Date("2025-10-09T21:00:00.000Z"),
                openalexUpdatedAt: new Date("2026-04-26T05:31:28.666Z"),
            }
        };

        expect(fetchPaperById).toHaveBeenCalledWith("W2741809807");
        expect(fetchPaperById).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedOutput);
    });
});