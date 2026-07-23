import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB pool's query method the queries the PostgreSQL DB for a paper with a particular id
vi.mock("../../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    },
}));

// Import after to replace the real function with the mock function
import pool from "../../../src/config/db.js";
import { fetchTopicById, fetchTopicPapers, fetchAllTopics } from "../../../src/repositories/topicRepository.js";


const mockResolvedTopic = {
    id: "T10102",
    openalex_id: "8572",
    topic_display_name: "scientometrics and bibliometrics research",
    topic_description: "This cluster of papers focuses on bibliometric analysis, research evaluation, and the assessment of scientific impact. It covers topics such as citation networks, collaboration patterns, open access publishing, social impact assessment, altmetrics, co-authorship networks, and interdisciplinary research.",
    topic_keywords: [ "Bibliometric Analysis", "Research Evaluation", "Scientific Impact", "Citation Networks" ],
    topic_wikipedia_url: "https://en.wikipedia.org/wiki/Bibliometrics",
    domain_openalex_id: "2",
    domain_display_name: "Social Sciences",
    field_openalex_id: "18",
    field_display_name: "Decision Sciences",
    subfield_openalex_id: "1804",
    subfield_display_name: "Statistics, Probability and Uncertainty",
    works_count: 100166,
    cited_by_count: 886459,
    works_api_url: "https://api.openalex.org/works?filter=topics.id:T10102",
    openalex_created_at: new Date("2024-01-23T13:27:05.000Z"),
    openalex_updated_at: new Date("2026-06-05T00:02:21.000Z")
}


const mockResolvedPapers1 = [
    {
        id: "927684",
        openalex_id: "W3160856016",
        title: "How to conduct a bibliometric analysis: An overview and guidelines",
        display_name: "How to conduct a bibliometric analysis: An overview and guidelines",
        abstract: null,
        publication_year: 2021,
        cited_by_count: 11949,
        fwci: 561.2863,
        primary_source_display_name: "Journal of Business Research",
        primary_topic_display_name: "scientometrics and bibliometrics research",
        is_open_access: false,
        open_access_status: "closed",
        author_count: 5,
        authors_preview: [
            { id: "A5074473734", name: "Naveen Donthu" },
            { id: "A5100777365", name: "Satish Kumar" }
        ]
    },
    {
        id: "892049",
        openalex_id: "W2128438887",
        title: "An index to quantify an individual's scientific research output",
        display_name: "An index to quantify an individual's scientific research output",
        abstract: "I propose the index h, defined as the number of papers with citation number > or =h, as a useful index to characterize the scientific output of a researcher.",
        publication_year: 2005,
        cited_by_count: 11490,
        fwci: 193.3915,
        primary_source_display_name: "Proceedings of the National Academy of Sciences",
        primary_topic_display_name: "Cognitive Science and Mapping",
        is_open_access: true,
        open_access_status: "green",
        author_count: 1,
        authors_preview: [
            { id: "A5078594205", name: "J. E. Hirsch" }
        ]
    },
    {
        id: "891969",
        openalex_id: "W1897139626",
        title: "Estimating the reproducibility of psychological science",
        display_name: "Estimating the reproducibility of psychological science",
        abstract: "Reproducibility is a defining feature of science, but the extent to which it characterizes current research is unknown. We conducted replications of 100 experimental ...",
        publicationYear: 2015,
        cited_by_count: 8641,
        fwci: 640.0553,
        primary_source_display_name: "Science",
        primary_topic_display_name: "Meta-analysis and systematic reviews",
        is_open_access: true,
        open_access_status: "green",
        author_count: 1,
        authors_preview: [
            { id: "A5049351295", name: "Alexander A. Aarts" }
        ]
    },
    {
        id: "984828",
        openalex_id: "W2111628838",
        title: "Analyzing the Past to Prepare for the Future: Writing a Literature Review",
        display_name: "Analyzing the Past to Prepare for the Future: Writing a Literature Review",
        abstract: "A review of prior, relevant literature is an essential feature of any academic project.An effective review creates a firm foundation for advancing knowledge.It facilitates theory development, closes areas where a plethora of research exists, and uncovers areas where research is needed.",
        publication_year: 2002,
        cited_by_count: 7088,
        fwci: 31.1825,
        primary_source_display_name: "MIS Quarterly",
        primary_topic_display_name: "scientometrics and bibliometrics research",
        is_open_access: true,
        open_access_status: "bronze",
        author_count: 2,
        authors_preview: [
            { id: "A5076319270", name: "Jane Webster" },
            { id: "A5000935199", name: "Richard T. Watson" }
        ]
    },
    {
        id: "951269",
        openalex_id: "W3125707221",
        title: "Bibliometric Methods in Management and Organization",
        display_name: "Bibliometric Methods in Management and Organization",
        abstract: "We aim to develop a meaningful single-source reference for management and organization scholars interested in using bibliometric methods for mapping research specialties. Such methods introduce ...",
        publication_year: 2014,
        cited_by_count: 6570,
        fwci: 48.7752,
        primary_source_display_name: "Organizational Research Methods",
        primary_topic_display_name: "Innovation and Knowledge Management",
        is_open_access: false,
        open_access_status: "closed",
        author_count: 2,
        authors_preview: [
            { id: "A5030808494", name: "Ivan Župič" },
            { id: "A5055535223", name: "Tomaž Čater" }
        ]
    }
];

const mockResolvedPapers2 = [
    
    {
        id: "898425",
        openalex_id: "W4292887282",
        title: "The Matthew Effect in Science",
        display_name: "The Matthew Effect in Science",
        abstract: "This account of the Matthew effect is another small exercise in the psychosociological analysis of the workings of science as a social institution. The initial problem is transformed by ...",
        publication_year: 1968,
        cited_by_count: 6234,
        fwci: 10.1563,
        primary_source_display_name: "Science",
        primary_topic_display_name: "Opinion Dynamics and Social Influence",
        is_open_access: false,
        open_access_status: "closed",
        author_count: 1,
        authors_preview: [
            { id: "A5112712778", name: "Robert Κ. Merton" }
        ]
    },
    {
        id: "899290",
        openalex_id: "W2005207065",
        title: "Co‐citation in the scientific literature: A new measure of the relationship between two documents",
        display_name: "Co‐citation in the scientific literature: A new measure of the relationship between two documents",
        abstract: "Abstract A new form of document coupling called co‐citation is defined as the frequency with which two documents are cited together. The co‐citation frequency ...",
        publication_year: 1973,
        cited_by_count: 5156,
        fwci: 10.5027,
        primary_source_display_name: "Journal of the American Society for Information Science",
        primary_topic_display_name: "scientometrics and bibliometrics research",
        is_open_access: false,
        open_access_status: "closed",
        author_count: 1,
        authors_preview: [
            { id: "A5087878724", name: "Henry Small" }
        ]
    },
    {
        id: "893288",
        openalex_id: "W2331384579",
        title: "Why Most Published Research Findings Are False",
        display_name: "Why Most Published Research Findings Are False",
        abstract: "Summary There is increasing concern that most current published research fi ndings are false. The probability that a research claim is true ...",
        publication_year: 2005,
        cited_by_count: 4834,
        fwci: 75.7318,
        primary_source_display_name: "CHANCE",
        primary_topic_display_name: "Meta-analysis and systematic reviews",
        is_open_access: false,
        open_access_status: "closed",
        author_count: 1,
        authors_preview: [
                { id: "A5070446713", name: "John P. A. Ioannidis" }
            ]
    },
    {
        id: "405159",   
        openalex_id: "W2120109270",
        title: "Comparison of PubMed, Scopus, Web of Science, and Google Scholar: strengths and weaknesses",
        display_name: "Comparison of PubMed, Scopus, Web of Science, and Google Scholar: strengths and weaknesses",
        abstract: "The evolution of the electronic age has led to the development of numerous medical databases on the World Wide Web, offering search facilities ...",
        publicationY_year: 2007,
        cited_by_count: 4715,
        fwci: 29.7602,
        primary_source_display_name: "The FASEB Journal",
        primary_topic_display_name: "scientometrics and bibliometrics research",
        is_open_access: false,
        open_access_status: "closed",
        author_count: 4,
        authors_preview: [
                { id: "A5047582800", name: "Matthew E. Falagas" },
                { id: "A5063271291", name: "Eleni Pitsouni" }
            ]
    },
    {
        id: "900252",
        openalex_id: "W1767272795",
        title: "The journal coverage of Web of Science and Scopus: a comparative analysis",
        display_name: "The journal coverage of Web of Science and Scopus: a comparative analysis",
        abstract: null,
        publication_year: 2015,
        cited_by_count: 4569,
        fwci: 57.7245,
        primary_source_display_name: "Scientometrics",
        primary_topic_display_name: "scientometrics and bibliometrics research",
        is_open_access: true,
        open_access_status: "green",
        author_count: 2,
        authors_preview: [
            { id: "A5081963935", name: "Philippe Mongeon" },
            { id: "A5086152924", name: "Adèle Paul‐Hus" }
        ]
    }
];


function expectFetchTopicQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM topics");
    expect(query).toContain("WHERE openalex_id = $1;");
} 

describe("fetchAuthorById", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches a topic for a valid openalex id", async () => {
        pool.query.mockResolvedValue({
            rows: [
                mockResolvedTopic
            ],
        });

        // The expected output is essentially the 1st element of the rows field, rows[0]
        const expectedOutput = mockResolvedTopic;
        
        const result = await fetchTopicById("T10102");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchTopicQuery(query);
        expect(params).toEqual(["T10102"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedOutput);
    });

    
    it("Fetches an empty array for an non-existent topic id", async () => {
        pool.query.mockResolvedValue({ 
            rows: [], 
        });

        const result = await fetchTopicById("T1010");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchTopicQuery(query);
        expect(params).toEqual(["T1010"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
    });

    // ------------- DATABASE ERRORS --------------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        const result = await expect(fetchTopicById("T10102")).rejects.toThrow("Unexpected DB error");

        // Verifying pool.query parameters
        const [query, params] = pool.query.mock.calls[0];

        expectFetchTopicQuery(query);
        expect(params).toEqual(["T10102"]);

        expect(pool.query).toHaveBeenCalledTimes(1);
    });
});


function expectFetchTopicPapersQuery(query) {
    expect(query).toContain("SELECT");
    expect(query).toContain("FROM papers p");
    expect(query).toContain("JOIN paper_topics pt");
    expect(query).toContain("ON pt.paper_id = p.id");
    expect(query).toContain("LEFT JOIN paper_authors pa");
    expect(query).toContain("ON pa.paper_id = p.id");
    expect(query).toContain("WHERE pt.topic_id = $1");
    expect(query).toContain("GROUP BY p.id");
    expect(query).toContain("ORDER BY p.cited_by_count DESC NULLS LAST");
    expect(query).toContain("LIMIT $2");
    expect(query).toContain("OFFSET $3;");
}

describe("fetchTopicPapers", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Fetches a topic's associated papers using default pagination", async () => {
        pool.query.mockResolvedValue({
            rows: [
                ...mockResolvedPapers1,
                ...mockResolvedPapers2
            ]
        });

        // Default pagination: 10 papers from 1st page of papers
        // LIMIT -> 10, OFFSET -> 0
        const results = await fetchTopicPapers("8572", 10, 0);

        const [query, params] = pool.query.mock.calls[0];

        expectFetchTopicPapersQuery(query);
        expect(params).toEqual(["8572", 10, 0]);

        expect(results).toEqual([...mockResolvedPapers1, ...mockResolvedPapers2]);
    });

    it("Fetches a topic's associated papers using custom pagination", async () => {
        pool.query.mockResolvedValue({
            rows: [
                ...mockResolvedPapers2
            ]
        });

        // Custom pagination: 5 paper from 2nd page of papers, 
        // LIMIT -> 5, OFFSET -> 5
        const results = await fetchTopicPapers("8572", 5, 5);

        const [query, params] = pool.query.mock.calls[0];

        expectFetchTopicPapersQuery(query);
        expect(params).toEqual(["8572", 5, 5]);

        expect(results).toEqual(mockResolvedPapers2);
    });

    // ---------- DB ERROR ----------
    
    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchTopicPapers("8572", 5, 0))
        .rejects
        .toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchTopicPapersQuery(query);
        expect(params).toEqual(["8572", 5, 0]);
    });
});


// Mocking only the first 5 out of 4392 topics
const mockResolvedTopics = [
    {
        primary_topic_display_name: "14-3-3 protein interactions", primary_topic_openalex_id: "T13526",
        primary_field_display_name: "Biochemistry, Genetics and Molecular Biology", primary_field_openalex_id: "13"
    },
    {
        primary_topic_display_name: "21st Century Education and Governance", primary_topic_openalex_id: "T14027",
        primary_field_display_name: "Social Sciences", primary_field_openalex_id: "33"
    },
    {
        primary_topic_display_name: "2D Materials and Applications", primary_topic_openalex_id: "T10275",
        primary_field_display_name: "Materials Science", primary_field_openalex_id: "25"
    },
    {
        primary_topic_display_name: "3D IC and TSV technologies",
        primary_topic_openalex_id: "T11527",
        primary_field_display_name: "Engineering",
        primary_field_openalex_id: "22"
    },
    {
        primary_topic_display_name: "3D Modeling in Geospatial Applications",
        primary_topic_openalex_id: "T12698",
        primary_field_display_name: "Engineering",
        primary_field_openalex_id: "22"
    },
];

// Helper function
function expectFetchAllTopicsQuery(query) {
    expect(query).toContain("SELECT DISTINCT primary_topic_display_name,");
    expect(query).toContain("primary_topic_openalex_id,");
    expect(query).toContain("primary_field_display_name,");
    expect(query).toContain("primary_field_openalex_id");
    expect(query).toContain("FROM papers");
    expect(query).toContain("WHERE primary_topic_openalex_id IS NOT NULL;");
}

describe("fetchAllTopics", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL CASE ----------

    it("Fetches all topics successfully", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedTopics
        });

        const results = await fetchAllTopics();

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAllTopicsQuery(query);
        expect(params).toEqual(undefined);
        expect(results).toEqual(mockResolvedTopics);
    });

    it("Fetches all topics successfully but in the wrong format", async () => {
        // Fetching the topic rows as an object and not a list,
        // is a successful execution case of the repository, but not for the service layer function
        pool.query.mockResolvedValue({
            rows: { ...mockResolvedTopics}
        });

        const results = await fetchAllTopics();

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAllTopicsQuery(query);
        expect(params).toEqual(undefined);
        expect(results).toEqual({...mockResolvedTopics});
    });

    // ---------- ERROR CASES ----------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchAllTopics()).rejects.toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];

        expectFetchAllTopicsQuery(query);
        expect(params).toEqual(undefined);
    });
});
