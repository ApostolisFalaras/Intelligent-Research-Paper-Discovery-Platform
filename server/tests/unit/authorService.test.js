import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository function the fetches a paper by id
vi.mock("./../../src/repositories/authorRepository.js", () => ({
    fetchAuthorById: vi.fn(),
    fetchAuthorAffiliationsById: vi.fn(),
    fetchAuthorLastKnownInstitutionsById: vi.fn(),
    fetchAuthorTopicsById: vi.fn(),
    fetchAuthorTopicSharesById: vi.fn(),
    fetchAuthorCountsByYearById: vi.fn(),
    fetchAuthorPapers: vi.fn()
}));

// Import after to replace the real function with the mock function
import { 
    fetchAuthorById,
    fetchAuthorAffiliationsById,
    fetchAuthorLastKnownInstitutionsById,
    fetchAuthorTopicsById,
    fetchAuthorTopicSharesById,
    fetchAuthorCountsByYearById, 
    fetchAuthorPapers } from "../../src/repositories/authorRepository.js";
import { getAuthorById, getAuthorPapers } from "../../src/services/authorService.js";


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

const mockResolvedPapers1 = [
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

const mockResolvedPapers2 = [
    
    {
        id: "387108",
        openalex_id: "W2066415719",
        title: "Who Shares? Who Doesn't? Factors Associated with Openly Archiving Raw Research Data",
        display_name: "Who Shares? Who Doesn't? Factors Associated with Openly Archiving Raw Research Data",
        abstract: "Many initiatives encourage investigators to share their raw datasets in hopes of increasing research efficiency and quality. Despite these investments of time and money, we do not have a firm grasp of who openly shares raw research data, who doesn't, and which initiatives are correlated with high rates of data sharing. In this analysis I use bibliometric methods to identify patterns in the frequency with which investigators openly archive their raw gene expression microarray datasets after study publication. Automated methods identified 11,603 articles published between 2000 and 2009 that describe the creation of gene expression microarray data. Associated datasets in best-practice repositories were found for 25% of these articles, increasing from less than 5% in 2001 to 30%-35% in 2007-2009. Accounting for sensitivity of the automated methods, approximately 45% of recent gene expression studies made their data publicly available. First-order factor analysis on 124 diverse bibliometric attributes of the data creation articles revealed 15 factors describing authorship, funding, institution, publication, and domain environments. In multivariate regression, authors were most likely to share data if they had prior experience sharing or reusing data, if their study was published in an open access journal or a journal with a relatively strong data sharing policy, or if the study was funded by a large number of NIH grants. Authors of studies on cancer and human subjects were least likely to make their datasets available. These results suggest research data sharing levels are still low and increasing only slowly, and data is least available in areas where it could make the biggest impact. Let's learn from those with high rates of sharing to embrace the full potential of our research output.",
        publication_year: 2011,
        cited_by_count: 216,
        fwci: 45.1038,
        primary_source_display_name: "PLoS ONE",
        primary_topic_display_name: "Research Data Management Practices",
        is_open_access: true,
        open_access_status: "gold",
        author_count: 1,
        authors_preview: [
            { id: "A5048491430", name: "Heather Piwowar" }
        ]
    },
    {
        id: "387266",
        opeanlex_id: "W2170531319",
        title: "Towards a Data Sharing Culture: Recommendations for Leadership from Academic Health Centers",
        display_name: "Towards a Data Sharing Culture: Recommendations for Leadership from Academic Health Centers",
        abstract: "haring biomedical research and health care data is important but difficult. Recognizing this, many initiatives facilitate, fund, request, or require researchers to share their data [1] These initiatives address the technical aspects of data sharing, but rarely focus on incentives for key stakeholders Academic health centers (AHCs) have a critical role in enabling, encouraging, and rewarding data sharing. The leaders of medical schools and academic-affiliated hospitals can play a unique role in supporting this transformation of the research enterprise. We propose that AHCs can and should lead the transition towards a culture of biomedical data sharing.",
        publication_year: 2008,
        cited_by_count: 153,
        fwci: 26.2434,
        primary_source_display_name: "PLoS Medicine",
        primary_topic_display_name: "Research Data Management Practices",
        is_open_access: true,
        open_access_status: "gold",
        author_count: 4,
        authors_preview: [
            { id: "A5048491430", name: "Heather Piwowar" },
            { id: "A5085379143", name: "Michael J. Becich" }
        ]
    },
    {
        id: "387321",
        openalex_id: "W1963524534",
        title: "Public sharing of research datasets: A pilot study of associations",
        display_name: "Public sharing of research datasets: A pilot study of associations",
        abstract: null,
        publication_year: 2009,
        cited_by_count: 142,
        fwci: 10.0924,
        primary_source_display_name: "Journal of Informetrics",
        primary_topic_display_name: "Research Data Management Practices",
        is_open_access: true,
        open_access_status: "green",
        author_count: 2,
        authors_preview: [
            { id: "A5048491430", name: "Heather Piwowar" },
            { id: "A5065170642", name: "Wendy W. Chapman" }
        ]
    },
    {
        id: "387562",
        openalex_id: "W2003014790",
        title: "Data archiving is a good investment",
        display_name: "Data archiving is a good investment",
        abstract: null,
        publication_year: 2011,
        cited_by_count: 108,
        fwci: 27.5204,
        primary_source_display_name: "Nature",
        primary_topic_display_name: "Research Data Management Practices",
        is_open_access: true,
        open_accessS_status: "bronze",
        author_count: 3,
        authors_preview: [
            { id: "A5048491430", name: "Heather Piwowar" },
            { id: "A5013911206", name: "Todd Vision" }
        ]
    },
    {
        id: "387648",
        openalex_id: "W2980172586",
        title: "The Future of OA: A large-scale analysis projecting Open Access publication and readership",
        display_name: "The Future of OA: A large-scale analysis projecting Open Access publication and readership",
        abstract: "Summary Understanding the growth of open access (OA) is important for deciding funder policy, subscription allocation, and infrastructure planning. This study analyses the number of papers available as OA over time. The models includes both OA embargo data and the relative growth rates of different OA types over time, based on the OA status of 70 million journal articles published between 1950 and 2019. The study also looks at article usage data, analyzing the proportion of views to OA articles vs views to articles which are closed access. Signal processing techniques are used to model how these viewership patterns change over time. Viewership data is based on 2.8 million uses of the Unpaywall browser extension in July 2019. We found that Green, Gold, and Hybrid papers receive more views than their Closed or Bronze counterparts, particularly Green papers made available within a year of publication. We also found that the proportion of Green, Gold, and Hybrid articles is growing most quickly. In 2019: 31% of all journal articles are available as OA 52% of article views are to OA articles Given existing trends, we estimate that by 2025: 44% of all journal articles will be available as OA 70% of article views will be to OA articles The declining relevance of closed access articles is likely to change the landscape of scholarly communication in the years to come. Percent of views, by OA type: Percent of papers, by OA type:",
        publication_year: 2019,
        cited_by_count: 100,
        fwci: 0,
        primary_source_display_name: "bioRxiv (Cold Spring Harbor Laboratory)",
        primary_topic_display_name: "scientometrics and bibliometrics research",
        is_open_access: true,
        open_access_status: "green",
        author_count: 3,
        authors_preview: [
            { id: "A5048491430", name: "Heather Piwowar" },
            { id: "A5023888391", name: "Jason Priem" }
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
        fetchAuthorPapers.mockResolvedValue(mockResolvedPapers1);
        
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

            topPapers: mockResolvedPapers1.map(paper => ({
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

        expect(fetchAuthorPapers).toHaveBeenCalledWith("50703", 5, 0);
        expect(fetchAuthorPapers).toHaveBeenCalledTimes(1);

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
        expect(fetchAuthorPapers).not.toHaveBeenCalled(); 
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
        expect(fetchAuthorPapers).not.toHaveBeenCalled();
    });


    it("Throws a 404 AppError when author doesn't exist", async () => {
        fetchAuthorById.mockResolvedValue(null);

        // Testing invalid author ID input
        await expect(getAuthorById("A5107860")).rejects.toThrow("Author not found");
        
        expect(fetchAuthorById).toHaveBeenCalledWith("A5107860");
        expect(fetchAuthorById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchAuthorLastKnownInstitutionsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicSharesById).not.toHaveBeenCalled();
        expect(fetchAuthorCountsByYearById).not.toHaveBeenCalled();  
        expect(fetchAuthorPapers).not.toHaveBeenCalled();
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
        expect(fetchAuthorPapers).not.toHaveBeenCalled(); 
    });
});

const defaultPaginationResults = [
    ...mockResolvedPapers1,
    ...mockResolvedPapers2
];


describe("getAuthorPapers", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Returns the papers associated with an author using default pagination", async () => {
        fetchAuthorById.mockResolvedValue(mockResolvedAuthor);
        fetchAuthorPapers.mockResolvedValue(defaultPaginationResults);

        const expectedOutput = defaultPaginationResults.map(paper => ({
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
        }));

        const results = await getAuthorPapers("A5107860229", {page: null, limit: null});

        expect(fetchAuthorPapers).toHaveBeenCalledWith("50703", 10, 0);
        expect(fetchAuthorPapers).toHaveBeenCalledTimes(1);
        expect(results).toEqual(expectedOutput);
    });

    it("Returns the papers associated with an author using custom pagination", async () => {
        fetchAuthorById.mockResolvedValue(mockResolvedAuthor);
        fetchAuthorPapers.mockResolvedValue(mockResolvedPapers2);

        const expectedOutput = mockResolvedPapers2.map(paper => ({
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
        }));

        const results = await getAuthorPapers("A5107860229", {page: 2, limit: 5});

        expect(fetchAuthorPapers).toHaveBeenCalledWith("50703", 5, 5);
        expect(fetchAuthorPapers).toHaveBeenCalledTimes(1);
        expect(results).toEqual(expectedOutput);
    });

    // ------------ USER ERRORS --------------

    it("Throws a 400 AppError when input id is not a string", async () => {
        // Assuming default pagination for simplicity
        await expect(getAuthorPapers(5107, {page: null, limit: null}))
        .rejects
        .toThrow("'author id' must be a string");

        expect(fetchAuthorPapers).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when input id is not a string", async () => {
        // Assuming default pagination for simplicity
        await expect(getAuthorPapers("5107", {page: null, limit: null}))
        .rejects
        .toThrow("Invalid author Id");

        expect(fetchAuthorPapers).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when page number is not a number", async () => {
        // Assuming default pagination limit for simplicity
        await expect(getAuthorPapers("A5107860229", {page: "first", limit: null}))
        .rejects
        .toThrow("'page' must be an integer");

        expect(fetchAuthorPapers).not.toHaveBeenCalled();
    });

    it("Throws a 400 AppError when limit is not a number", async () => {
        // Assuming default pagination page for simplicity
        await expect(getAuthorPapers("A5107860229", {page: null, limit: "five"}))
        .rejects
        .toThrow("'limit' must be an integer");

        expect(fetchAuthorPapers).not.toHaveBeenCalled();
    });

    it("Throws a 404 AppError when author doesn't exist", async () => {
        fetchAuthorById.mockResolvedValue(null);

        // Testing invalid author ID input
        await expect(getAuthorPapers("A5107860", {page: null, limit: null}))
        .rejects
        .toThrow("Author not found");
        
        expect(fetchAuthorById).toHaveBeenCalledWith("A5107860");
        expect(fetchAuthorById).toHaveBeenCalledTimes(1);
  
        expect(fetchAuthorPapers).not.toHaveBeenCalled();
    });

    // ------------ DATABASE ERRORS --------------

    it("Propagates repository error", async () => {
        fetchAuthorById.mockResolvedValue(mockResolvedAuthor);
        fetchAuthorPapers.mockRejectedValue(new Error("Database query failed."));

        await expect(getAuthorPapers("A5107860229", {page: null, limit: null}))
        .rejects
        .toThrow("Database query failed.");

        expect(fetchAuthorById).toHaveBeenCalledWith("A5107860229");
        expect(fetchAuthorById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorPapers).toHaveBeenCalledWith("50703", 10, 0);
        expect(fetchAuthorPapers).toHaveBeenCalledTimes(1); 
    });
});