import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository function the fetches a paper by id
vi.mock("./../../src/repositories/paperRepository.js", () => ({
    fetchPaperById: vi.fn(),
}));

// Import after to replace the real function with the mock function
import { fetchPaperById } from "./../../src/repositories/paperRepository.js";
import { getPaperById } from "./../../src/services/paperService.js";


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
    indexed_in: [ "crossref", "datacite", "doaj", "pubmed" ],
    is_retracted: false,
    is_paratext: false,
    openalex_created_at: new Date("2025-10-09T21:00:00.000Z"),
    openalex_updated_at: new Date("2026-04-26T05:31:28.666Z")
};

describe("getPaperById", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Returns a paper and maps it to a formatted paper DTO", async () => {
        fetchPaperById.mockResolvedValue(mockResolvedPaper);
        
        const result = await getPaperById("W2741809807");

        const expectedOutput = {
            id: mockResolvedPaper.openalex_id,
            internalId: mockResolvedPaper.id,
            doi: mockResolvedPaper.doi,
            title: mockResolvedPaper.title,
            displayName: mockResolvedPaper.display_name,
            abstract: mockResolvedPaper.abstract,
            publication: {
                year: mockResolvedPaper.publication_year,
                date: "2018-02-12",
                type: mockResolvedPaper.paper_type,
                language: mockResolvedPaper.language
            },
            source: {
                id: mockResolvedPaper.primary_source_openalex_id,
                name: mockResolvedPaper.primary_source_display_name,
                type: mockResolvedPaper.primary_source_type,
                volume: mockResolvedPaper.biblio_volume,
                issue: mockResolvedPaper.biblio_issue,
                pages: mockResolvedPaper.biblio_first_page
            },
            topic: {
                id: mockResolvedPaper.primary_topic_openalex_id,
                name: mockResolvedPaper.primary_topic_display_name,
                domain: mockResolvedPaper.primary_domain_display_name,
                field: mockResolvedPaper.primary_field_display_name,
                subfield: mockResolvedPaper.primary_subfield_display_name
            },
            metrics: {
                citedByCount: mockResolvedPaper.cited_by_count,
                fwci: 490.1635,
                citationPercentile: 1,
                top1Percent: mockResolvedPaper.citation_top_1_percent,
                top10Percent: mockResolvedPaper.citation_top_10_percent,
                referencedWorksCount: mockResolvedPaper.referenced_works_count
            },
            access: {
                isOpenAccess: mockResolvedPaper.is_open_access,
                status: mockResolvedPaper.open_access_status,
                bestURL: mockResolvedPaper.open_access_best_url,
                anyRepoHasFullText: mockResolvedPaper.open_access_any_repo_has_fulltext,
                hasFullText: mockResolvedPaper.has_fulltext,
                hasPDF: mockResolvedPaper.has_content_pdf,
                hasGrobIdXML: mockResolvedPaper.has_content_grobid_xml
            },
            indexedIn: mockResolvedPaper.indexed_in,
            flags: {
                isRetracted: mockResolvedPaper.is_retracted,
                isParatext: mockResolvedPaper.is_paratext
            },
            metadata: {
                openalexCreatedAt: mockResolvedPaper.openalex_created_at,
                openalexUpdatedAt: mockResolvedPaper.openalex_updated_at,
            }
        };

        expect(fetchPaperById).toHaveBeenCalledWith("W2741809807");
        expect(fetchPaperById).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedOutput);
    });

    // ------------ USER ERRORS --------------
    
    it("Throws a 400 AppError when input id is invalid", async () => {
        await expect(getPaperById(123)).rejects.toThrow("Invalid paper Id");

        // The invalid id is rejected before the repository function is called
        expect(fetchPaperById).not.toHaveBeenCalled();    
    });


    it("Throws a 404 AppError when paper doesn't exist", async () => {
        // Testing invalid paper ID input
        await expect(getPaperById("W123")).rejects.toThrow("Paper not found");
        
        expect(fetchPaperById).toHaveBeenCalledWith("W123");
        expect(fetchPaperById).toHaveBeenCalledTimes(1);
    });

    // ------------ DATABASE ERRORS --------------

    it("Propagates repository error", async () => {
        fetchPaperById.mockRejectedValue(new Error("Database query failed."));

        await expect(getPaperById("W2741809807")).rejects.toThrow("Database query failed.");

        expect(fetchPaperById).toHaveBeenCalledWith("W2741809807");
        expect(fetchPaperById).toHaveBeenCalledTimes(1);
    });
});