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
    fetchAuthorPapers } from "../../src/repositories/authorRepository.js";


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


function expectFetchAuthorPapersQuery(query) {
    expect(query).toContain("SELECT");
    expect(query).toContain("FROM papers p");
    expect(query).toContain("JOIN paper_authors pa_target");
    expect(query).toContain("ON pa_target.paper_id = p.id");
    expect(query).toContain("LEFT JOIN paper_authors pa_all");
    expect(query).toContain("ON pa_all.paper_id = p.id");
    expect(query).toContain("WHERE pa_target.author_id = $1");
    expect(query).toContain("GROUP BY p.id");
    expect(query).toContain("ORDER BY p.cited_by_count DESC NULLS LAST");
    expect(query).toContain("LIMIT $2");
    expect(query).toContain("OFFSET $3;");
}

describe("fetchAuthorPapers", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches the top 5 top papers associated with a particular author", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedPapers1
        });

        const results = await fetchAuthorPapers("50703", 5, 0);

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorPapersQuery(query);
        expect(params).toEqual(["50703", 5, 0]);

        expect(results).toEqual(mockResolvedPapers1);
    });

    it("Fetches an authors associated papers using default pagination", async () => {
        pool.query.mockResolvedValue({
            rows: [
                ...mockResolvedPapers1,
                ...mockResolvedPapers2
            ]
        });

        // Default pagination: 10 papers from 1st page of papers
        // LIMIT -> 10, OFFSET -> 0
        const results = await fetchAuthorPapers("50703", 10, 0);

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorPapersQuery(query);
        expect(params).toEqual(["50703", 10, 0]);

        expect(results).toEqual([...mockResolvedPapers1, ...mockResolvedPapers2]);
    });

    it("Fetches an authors associated papers using custom pagination", async () => {
        pool.query.mockResolvedValue({
            rows: [
                ...mockResolvedPapers2
            ]
        });

        // Custom pagination: 5 paper from 2nd page of papers, 
        // LIMIT -> 5, OFFSET -> 5
        const results = await fetchAuthorPapers("50703", 5, 5);

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorPapersQuery(query);
        expect(params).toEqual(["50703", 5, 5]);

        expect(results).toEqual(mockResolvedPapers2);
    });

    it("Fetches an authors associated papers using custom pagination", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        // Custom pagination: 10 papers from 5th page of papers, 
        // LIMIT -> 10, OFFSET -> 40
        const results = await fetchAuthorPapers("50703", 10, 40);

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorPapersQuery(query);
        expect(params).toEqual(["50703", 10, 40]);

        expect(results).toEqual([]);
    });

    it("Fetches an empty array for an invalid internal author id", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const results = await fetchAuthorPapers("50703", 5, 0);

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorPapersQuery(query);
        expect(params).toEqual(["50703", 5, 0]);

        expect(results).toEqual([]);
    });

    // ---------- DB ERROR ----------
    
    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchAuthorPapers("50703", 5, 0))
        .rejects
        .toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAuthorPapersQuery(query);
        expect(params).toEqual(["50703", 5, 0]);
    });
});