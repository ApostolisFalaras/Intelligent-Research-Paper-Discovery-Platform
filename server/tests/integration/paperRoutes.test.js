import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the paper repository function that queries the PostgreSQL DB for a paper with a particular id
vi.mock("./../../src/repositories/paperRepository.js", () => ({ 
    fetchPaperById: vi.fn(),
    fetchPaperAuthorsById: vi.fn(),
    fetchPaperAuthorInstitutionsById: vi.fn(),
    fetchPaperAuthorAffiliationsById: vi.fn(),
    fetchPaperTopicsById: vi.fn(),
    fetchPaperKeywordsById: vi.fn(),
    fetchPaperLocationsById: vi.fn(),
    fetchPaperReferencesById: vi.fn(),
    fetchPaperRelatedById: vi.fn(),
    fetchPaperCountsByYearById: vi.fn(),
}));

vi.mock("./../../src/repositories/recommendationEventRepository.js", () => ({
    upsertPaperView: vi.fn(),
    incrementPaperViewCount: vi.fn(),
    incrementRecommendationClickCount: vi.fn()
}));

vi.mock("../../src/repositories/recommendationRefreshRepository.js", () => ({
    markUserRecommendationsStale: vi.fn()
}));

// Middleware has to be mocked to authenticate the only existing user in the current tests
let mockAuthenticatedUser = {id: 1};

vi.mock("./../../src/middlewares/authMiddleware.js", async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        optionalAuthMiddleware: (req, res, next) => {
            req.user = mockAuthenticatedUser;
            next();
        }
    }
});

// Import after to replace the real function with the mock function
import { 
    fetchPaperById,
    fetchPaperAuthorAffiliationsById, 
    fetchPaperAuthorInstitutionsById, 
    fetchPaperAuthorsById,  
    fetchPaperCountsByYearById, 
    fetchPaperKeywordsById, 
    fetchPaperLocationsById, 
    fetchPaperReferencesById, 
    fetchPaperRelatedById, 
    fetchPaperTopicsById } from "../../src/repositories/paperRepository.js";
import app from "./../../src/app.js";
import { incrementPaperViewCount, incrementRecommendationClickCount, upsertPaperView } from "../../src/repositories/recommendationEventRepository.js";
import { optionalAuthMiddleware } from "../../src/middlewares/authMiddleware.js";
import { markUserRecommendationsStale } from "../../src/repositories/recommendationRefreshRepository.js";


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

// Mocking 2/10 citation counts by year
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

// The route's expected data output
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
        openalexCreatedAt: new Date(mockResolvedPaper.openalex_created_at).toISOString(),
        openalexUpdatedAt: new Date(mockResolvedPaper.openalex_updated_at).toISOString(),
    },

    authors: mockResolvedPaperAuthors.map(author => ({
        id: author.author_openalex_id,
        orcid: author.author_orcid,
        displayName: author.author_display_name,
        rawAuthorName: author.raw_author_name,
        order: author.author_order,
        position: author.author_position,
        isCorresponding: author.is_corresponding,

        institutions: mockResolvedPaperInstitutions
            .filter(inst => inst.paper_author_id === author.id)
            .map(inst => ({
                id: inst.institution_openalex_id,
                ror: inst.institution_ror,
                displayName: inst.institution_display_name,
                countryCode: inst.country_code,
                type: inst.institution_type,
                lineage: inst.lineage ?? []
            })),

        affiliations: mockResolvedPaperAffiliations
            .filter(aff => aff.paper_author_id === author.id)
            .map(aff => ({
                internalId: aff.id,
                rawString: aff.raw_affiliation_string,
                institutionIds: aff.institution_ids ?? []
            }))
    })),

    topics: mockResolvedTopics.map(topic => ({
        id: topic.topic_openalex_id,
        displayName: topic.topic_display_name,
        score: topic.score === null ? null : Number(topic.score),
        domain: {
            id: topic.domain_openalex_id,
            name: topic.domain_display_name
        },
        field: {
            id: topic.field_openalex_id,
            name: topic.field_display_name
        },
        subfield: {
            id: topic.subfield_openalex_id,
            name: topic.subfield_display_name
        },
        isPrimary: topic.is_primary_topic
    })),

    keywords: mockResolvedKeywords.map(keyword => ({
        id: keyword.keyword_openalex_id,
        displayName: keyword.keyword_display_name,
        score: keyword.score === null ? null : Number(keyword.score)
    })),

    locations: mockResolvedLocations.map(location => ({
        id: location.location_openalex_id,
        isOpenAccess: location.is_oa,
        landingPageUrl: location.landing_page_url,
        pdfUrl: location.pdf_url,

        source: {
            id: location.source_openalex_id,
            displayName: location.source_display_name,
            issnL: location.source_issn_l,
            issn: location.source_issn ?? [],
            isOpenAccess: location.source_is_oa,
            isInDOAJ: location.source_is_in_doaj,
            isCore: location.source_is_core,
            hostOrganization: location.source_host_organization,
            hostOrganizationName: location.source_host_organization_name,
            hostOrganizationLineage: location.source_host_organization_lineage ?? [],
            type: location.source_type
        },

        license: {
            name: location.license,
            id: location.license_id
        },

        version: location.version,
        isAccepted: location.is_accepted,
        isPublished: location.is_published,
        rawSourceName: location.raw_source_name,
        rawType: location.raw_type,
        isPrimary: location.is_primary,
        isBestOpenAccess: location.is_best_oa
    })),

    references: mockResolvedReferences.map(reference => ({
        id: reference.referenced_work_openalex_id,
    })),

    relatedPapers: mockResolvedRelated.map(related => ({
        id: related.related_work_openalex_id,
    })),

    countsByYear: mockResolvedCountByYear.map(count => ({
        year: count.year,
        citedByCount: count.cited_by_count
    }))
};



// Helper function to verify repository method calls and parameters
function expectFetchPaperRepositoryFunctions(internalPaperId) {
    expect(fetchPaperAuthorsById).toHaveBeenCalledWith(internalPaperId);
        expect(fetchPaperAuthorsById).toHaveBeenCalledTimes(1);

        expect(fetchPaperAuthorInstitutionsById).toHaveBeenCalledWith(internalPaperId);
        expect(fetchPaperAuthorInstitutionsById).toHaveBeenCalledTimes(1);

        expect(fetchPaperAuthorAffiliationsById).toHaveBeenCalledWith(internalPaperId);
        expect(fetchPaperAuthorAffiliationsById).toHaveBeenCalledTimes(1);

        expect(fetchPaperTopicsById).toHaveBeenCalledWith(internalPaperId);
        expect(fetchPaperTopicsById).toHaveBeenCalledTimes(1);

        expect(fetchPaperKeywordsById).toHaveBeenCalledWith(internalPaperId);
        expect(fetchPaperKeywordsById).toHaveBeenCalledTimes(1);

        expect(fetchPaperLocationsById).toHaveBeenCalledWith(internalPaperId);
        expect(fetchPaperLocationsById).toHaveBeenCalledTimes(1);

        expect(fetchPaperReferencesById).toHaveBeenCalledWith(internalPaperId);
        expect(fetchPaperReferencesById).toHaveBeenCalledTimes(1);

        expect(fetchPaperRelatedById).toHaveBeenCalledWith(internalPaperId);
        expect(fetchPaperRelatedById).toHaveBeenCalledTimes(1);

        expect(fetchPaperCountsByYearById).toHaveBeenCalledWith(internalPaperId);
        expect(fetchPaperCountsByYearById).toHaveBeenCalledTimes(1);
}

describe("GET /api/papers/:id", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
        mockAuthenticatedUser = { id: 1 };
    });

    it("Returns 200 and the paper when accessed by an authenticated user", async () => {
        fetchPaperById.mockResolvedValue(mockResolvedPaper);
        fetchPaperAuthorsById.mockResolvedValue(mockResolvedPaperAuthors);
        fetchPaperAuthorInstitutionsById.mockResolvedValue(mockResolvedPaperInstitutions);
        fetchPaperAuthorAffiliationsById.mockResolvedValue(mockResolvedPaperAffiliations);
        fetchPaperTopicsById.mockResolvedValue(mockResolvedTopics);
        fetchPaperKeywordsById.mockResolvedValue(mockResolvedKeywords);
        fetchPaperLocationsById.mockResolvedValue(mockResolvedLocations);
        fetchPaperReferencesById.mockResolvedValue(mockResolvedReferences);
        fetchPaperRelatedById.mockResolvedValue(mockResolvedRelated);
        fetchPaperCountsByYearById.mockResolvedValue(mockResolvedCountByYear);

        const response = await request(app).get("/api/papers/W2741809807").expect(200);

        expect(fetchPaperById).toHaveBeenCalledWith("W2741809807");
        expect(fetchPaperById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedOutput);
    });

    it("Returns 200 and the paper when accessed by an authenticated user as a recommendation", async () => {
        fetchPaperById.mockResolvedValue(mockResolvedPaper);
        fetchPaperAuthorsById.mockResolvedValue(mockResolvedPaperAuthors);
        fetchPaperAuthorInstitutionsById.mockResolvedValue(mockResolvedPaperInstitutions);
        fetchPaperAuthorAffiliationsById.mockResolvedValue(mockResolvedPaperAffiliations);
        fetchPaperTopicsById.mockResolvedValue(mockResolvedTopics);
        fetchPaperKeywordsById.mockResolvedValue(mockResolvedKeywords);
        fetchPaperLocationsById.mockResolvedValue(mockResolvedLocations);
        fetchPaperReferencesById.mockResolvedValue(mockResolvedReferences);
        fetchPaperRelatedById.mockResolvedValue(mockResolvedRelated);
        fetchPaperCountsByYearById.mockResolvedValue(mockResolvedCountByYear);

        const response = await request(app).get("/api/papers/W2741809807")
        .query({isRecommendation: true}).expect(200);

        expectFetchPaperRepositoryFunctions("386866");

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedOutput);
    });

    it("Returns 200 and the paper when accessed by an un-authenticated user", async () => {
        mockAuthenticatedUser = {id: null};

        fetchPaperById.mockResolvedValue(mockResolvedPaper);
        fetchPaperAuthorsById.mockResolvedValue(mockResolvedPaperAuthors);
        fetchPaperAuthorInstitutionsById.mockResolvedValue(mockResolvedPaperInstitutions);
        fetchPaperAuthorAffiliationsById.mockResolvedValue(mockResolvedPaperAffiliations);
        fetchPaperTopicsById.mockResolvedValue(mockResolvedTopics);
        fetchPaperKeywordsById.mockResolvedValue(mockResolvedKeywords);
        fetchPaperLocationsById.mockResolvedValue(mockResolvedLocations);
        fetchPaperReferencesById.mockResolvedValue(mockResolvedReferences);
        fetchPaperRelatedById.mockResolvedValue(mockResolvedRelated);
        fetchPaperCountsByYearById.mockResolvedValue(mockResolvedCountByYear);

        const response = await request(app).get("/api/papers/W2741809807")
        .query({isRecommendation: true}).expect(200);

        expectFetchPaperRepositoryFunctions("386866");

        expect(upsertPaperView).not.toHaveBeenCalled();
        expect(incrementRecommendationClickCount).not.toHaveBeenCalled();

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedOutput);
    });

    it("Returns 200 and the paper when accessed even if recording the paper view event fails", async () => {
        fetchPaperById.mockResolvedValue(mockResolvedPaper);
        fetchPaperAuthorsById.mockResolvedValue(mockResolvedPaperAuthors);
        fetchPaperAuthorInstitutionsById.mockResolvedValue(mockResolvedPaperInstitutions);
        fetchPaperAuthorAffiliationsById.mockResolvedValue(mockResolvedPaperAffiliations);
        fetchPaperTopicsById.mockResolvedValue(mockResolvedTopics);
        fetchPaperKeywordsById.mockResolvedValue(mockResolvedKeywords);
        fetchPaperLocationsById.mockResolvedValue(mockResolvedLocations);
        fetchPaperReferencesById.mockResolvedValue(mockResolvedReferences);
        fetchPaperRelatedById.mockResolvedValue(mockResolvedRelated);
        fetchPaperCountsByYearById.mockResolvedValue(mockResolvedCountByYear);

        const response = await request(app).get("/api/papers/W2741809807")
        .query({isRecommendation: true}).expect(200);

        expectFetchPaperRepositoryFunctions("386866");

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedOutput);
    });

    // ------------- USER ERRORS ---------------

    it("Returns 400 when paper Id doesn't follow the correct format", async () => {
        fetchPaperById.mockResolvedValue(null);

        const response = await request(app).get("/api/papers/123").expect(400);

        expect(fetchPaperById).not.toHaveBeenCalled();
        expect(fetchPaperAuthorsById).not.toHaveBeenCalled();
        expect(fetchPaperAuthorInstitutionsById).not.toHaveBeenCalled();
        expect(fetchPaperAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchPaperTopicsById).not.toHaveBeenCalled();
        expect(fetchPaperKeywordsById).not.toHaveBeenCalled();
        expect(fetchPaperLocationsById).not.toHaveBeenCalled();
        expect(fetchPaperReferencesById).not.toHaveBeenCalled();
        expect(fetchPaperRelatedById).not.toHaveBeenCalled();
        expect(fetchPaperCountsByYearById).not.toHaveBeenCalled();

        expect(upsertPaperView).not.toHaveBeenCalled();
        expect(incrementRecommendationClickCount).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Invalid paper Id");
    });


    it("Returns 404 when the paper doesn't exist", async () => {
        fetchPaperById.mockResolvedValue(null);

        const response = await request(app).get("/api/papers/W123").expect(404);

        expect(fetchPaperById).toHaveBeenCalledWith("W123");
        expect(fetchPaperById).toHaveBeenCalledTimes(1);

        expect(fetchPaperAuthorsById).not.toHaveBeenCalled();
        expect(fetchPaperAuthorInstitutionsById).not.toHaveBeenCalled();
        expect(fetchPaperAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchPaperTopicsById).not.toHaveBeenCalled();
        expect(fetchPaperKeywordsById).not.toHaveBeenCalled();
        expect(fetchPaperLocationsById).not.toHaveBeenCalled();
        expect(fetchPaperReferencesById).not.toHaveBeenCalled();
        expect(fetchPaperRelatedById).not.toHaveBeenCalled();
        expect(fetchPaperCountsByYearById).not.toHaveBeenCalled();

        expect(upsertPaperView).not.toHaveBeenCalled();
        expect(incrementRecommendationClickCount).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Paper not found");
    });

    // -------------- DATABASE ERRORS --------------

    it("Returns 500 when the server fails", async () => {
        fetchPaperById.mockRejectedValue(new Error("Unexpected failure"));

        const response = await request(app).get("/api/papers/W2741809807").expect(500);

        expect(fetchPaperById).toHaveBeenCalledWith("W2741809807");
        expect(fetchPaperById).toHaveBeenCalledTimes(1);

        expect(fetchPaperAuthorsById).not.toHaveBeenCalled();
        expect(fetchPaperAuthorInstitutionsById).not.toHaveBeenCalled();
        expect(fetchPaperAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchPaperTopicsById).not.toHaveBeenCalled();
        expect(fetchPaperKeywordsById).not.toHaveBeenCalled();
        expect(fetchPaperLocationsById).not.toHaveBeenCalled();
        expect(fetchPaperReferencesById).not.toHaveBeenCalled();
        expect(fetchPaperRelatedById).not.toHaveBeenCalled();
        expect(fetchPaperCountsByYearById).not.toHaveBeenCalled();

        expect(upsertPaperView).not.toHaveBeenCalled();
        expect(incrementRecommendationClickCount).not.toHaveBeenCalled();

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Unexpected failure");
    });
});
