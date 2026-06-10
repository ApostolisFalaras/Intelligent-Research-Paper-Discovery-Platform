import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository function the fetches a paper by id
vi.mock("./../../src/repositories/authorRepository.js", () => ({
    fetchAuthorById: vi.fn(),
    fetchAuthorAffiliationsById: vi.fn(),
    fetchAuthorLastKnownInstitutionsById: vi.fn(),
    fetchAuthorTopicsById: vi.fn(),
    fetchAuthorTopicSharesById: vi.fn(),
    fetchAuthorCountsByYearById: vi.fn(),
    fetchAuthorTop5Papers: vi.fn()
}));

// Import after to replace the real function with the mock function
import { 
    fetchAuthorById,
    fetchAuthorAffiliationsById,
    fetchAuthorLastKnownInstitutionsById,
    fetchAuthorTopicsById,
    fetchAuthorTopicSharesById,
    fetchAuthorCountsByYearById, 
    fetchAuthorTop5Papers } from "../../src/repositories/authorRepository.js";
import { getAuthorById } from "../../src/services/authorService.js";


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
const mockResolvedAuthorAffiliations = [
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
    },
];

// For this particular author, the last known institutions field is an empty list,
// But if it had fields, it follows the same structure as "affiliations" without they "years" fields
const mockResolvedAuthorInstitutions = [];

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

describe("getAuthorById", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Returns an author and maps it to a formatted paper DTO", async () => {
        fetchAuthorById.mockResolvedValue(mockResolvedAuthor);
        fetchAuthorAffiliationsById.mockResolvedValue(mockResolvedAuthorAffiliations);
        fetchAuthorLastKnownInstitutionsById.mockResolvedValue(mockResolvedAuthorInstitutions);
        fetchAuthorTopicsById.mockResolvedValue(mockResolvedAuthorTopics);
        fetchAuthorTopicSharesById.mockResolvedValue(mockResolvedAuthorTopicShares);
        fetchAuthorCountsByYearById.mockResolvedValue(mockResolvedAuthorCountsByYear);
        fetchAuthorTop5Papers.mockResolvedValue(mockResolvedTop5Papers);
        
        const expectedOutput = {
            id: mockResolvedAuthor.openalex_id,
            internalId: mockResolvedAuthor.id,
            orcid: mockResolvedAuthor.orcid,

            displayName: mockResolvedAuthor.display_name,
            rawAuthorNames: mockResolvedAuthor.raw_author_names ?? [],
            fullName: mockResolvedAuthor.full_name,

            worksCount: mockResolvedAuthor.works_count,
            citedByCount: mockResolvedAuthor.cited_by_count,
            twoYearMeanCitedness: mockResolvedAuthor.two_year_mean_citedness === null
                ? null
                : Number(mockResolvedAuthor.two_year_mean_citedness),
            hIndex: mockResolvedAuthor.h_index,
            i10Index: mockResolvedAuthor.i10_index,

            worksApiURL: mockResolvedAuthor.works_api_url,
            createdAt: mockResolvedAuthor.openalex_created_at,
            updatedAt: mockResolvedAuthor.openalex_updated_at,

            affiliations: mockResolvedAuthorAffiliations.map(aff => ({
                id: aff.institution_openalex_id,
                institutionRor: aff.institution_ror,
                displayName: aff.institution_display_name,
                countryCode: aff.institution_country_code,
                institutionType: aff.institution_type,
                lineage: aff.lineage,
                years: aff.years
            })),

            lastKnownInstitutions: mockResolvedAuthorInstitutions.map(inst => ({
                id: inst.institution_openalex_id,
                institutionRor: inst.institution_ror,
                displayName: inst.institution_display_name,
                countryCode: inst.institution_country_code,
                institutionType: inst.institution_type,
                lineage: inst.institution_lineage,
            })),

            topics: mockResolvedAuthorTopics.map(topic => ({
                id: topic.topic_openalex_id,
                displayName: topic.topic_display_name,
                worksCount: topic.works_count,
                domainId: topic.domain_openalex_id,
                domain: topic.domain_display_name,
                fieldId: topic.field_openalex_id,
                field: topic.field_display_name,
                subfieldId: topic.subfield_openalex_id,
                subfield: topic.subfield_display_name
            })),

            topicShares: mockResolvedAuthorTopicShares.map(share => ({
                id: share.topic_openalex_id,
                displayName: share.topic_display_name,
                value: share.value === null ? null : Number(share.value),
                domainId: share.domain_openalex_id,
                domain: share.domain_display_name,
                fieldId: share.field_openalex_id,
                field: share.field_display_name,
                subfieldId: share.subfield_openalex_id,
                subfield: share.subfield_display_name
            })),

            countsByYear: mockResolvedAuthorCountsByYear.map(count => ({
                year: count.year,
                worksCount: count.works_count,
                oaWorksCount: count.oa_works_count,
                citedByCount: count.cited_by_count
            })),

            topPapers: mockResolvedTop5Papers.map(paper => ({
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
                authorCount: Number(paper.author_count),
                authorsPreview: paper.authors_preview,
            }))
        };


        const result = await getAuthorById("A5107860229");

        expect(fetchAuthorById).toHaveBeenCalledWith("A5107860229");
        expect(fetchAuthorById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorAffiliationsById).toHaveBeenCalledWith("50703");
        expect(fetchAuthorAffiliationsById).toHaveBeenCalledTimes(1);
        
        expect(fetchAuthorLastKnownInstitutionsById).toHaveBeenCalledWith("50703");
        expect(fetchAuthorLastKnownInstitutionsById).toHaveBeenCalledTimes(1);
        
        expect(fetchAuthorTopicsById).toHaveBeenCalledWith("50703");
        expect(fetchAuthorTopicsById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorTopicSharesById).toHaveBeenCalledWith("50703");
        expect(fetchAuthorTopicSharesById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorCountsByYearById).toHaveBeenCalledWith("50703");
        expect(fetchAuthorCountsByYearById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorTop5Papers).toHaveBeenCalledWith("50703");
        expect(fetchAuthorTop5Papers).toHaveBeenCalledTimes(1);

        expect(result).toEqual(expectedOutput);
    });

    // ------------ USER ERRORS --------------
    
    it("Throws a 400 AppError when input id is not a string", async () => {
        await expect(getAuthorById(5107)).rejects.toThrow("'author id' must be a string");

        // The invalid id is rejected before the repository function is called
        expect(fetchAuthorById).not.toHaveBeenCalled();
        expect(fetchAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchAuthorLastKnownInstitutionsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicSharesById).not.toHaveBeenCalled();
        expect(fetchAuthorCountsByYearById).not.toHaveBeenCalled(); 
    });

    it("Throws a 400 AppError when input id has invalid format", async () => {
        await expect(getAuthorById("5107")).rejects.toThrow("Invalid author Id");

        // The invalid id is rejected before the repository function is called
        expect(fetchAuthorById).not.toHaveBeenCalled();
        expect(fetchAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchAuthorLastKnownInstitutionsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicSharesById).not.toHaveBeenCalled();
        expect(fetchAuthorCountsByYearById).not.toHaveBeenCalled();  
        expect(fetchAuthorTop5Papers).not.toHaveBeenCalled();
    });


    it("Throws a 404 AppError when author doesn't exist", async () => {
        // Testing invalid paper ID input
        await expect(getAuthorById("A5107860")).rejects.toThrow("Author not found");
        
        expect(fetchAuthorById).toHaveBeenCalledWith("A5107860");
        expect(fetchAuthorById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchAuthorLastKnownInstitutionsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicSharesById).not.toHaveBeenCalled();
        expect(fetchAuthorCountsByYearById).not.toHaveBeenCalled();  
        expect(fetchAuthorTop5Papers).not.toHaveBeenCalled();
    });

    // ------------ DATABASE ERRORS --------------

    it("Propagates repository error", async () => {
        fetchAuthorById.mockRejectedValue(new Error("Database query failed."));

        await expect(getAuthorById("A5107860229")).rejects.toThrow("Database query failed.");

        expect(fetchAuthorById).toHaveBeenCalledWith("A5107860229");
        expect(fetchAuthorById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchAuthorLastKnownInstitutionsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicSharesById).not.toHaveBeenCalled();
        expect(fetchAuthorCountsByYearById).not.toHaveBeenCalled();
        expect(fetchAuthorTop5Papers).not.toHaveBeenCalled(); 
    });
});