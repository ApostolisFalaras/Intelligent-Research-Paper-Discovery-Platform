import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the paper repository function that queries the PostgreSQL DB for a paper with a particular id
vi.mock("./../../src/repositories/topicRepository.js", () => ({ 
    fetchTopicById: vi.fn(),
    fetchTopicPapers: vi.fn()
}));

// Import after to replace the real function with the mock function
import { fetchTopicById, fetchTopicPapers } from "../../src/repositories/topicRepository.js";
import app from "../../src/app.js";


const mockResolvedTopic = {
    id: "8572",
    openalex_id: "T10102",
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
    openalex_created_at: new Date("2024-01-23T13:27:05.000Z").toISOString(),
    openalex_updated_at: new Date("2026-06-05T00:02:21.000Z").toISOString()
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


describe("GET /api/topics/:id", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Returns 200 and the topic when found", async () => {
        fetchTopicById.mockResolvedValue(mockResolvedTopic);
        fetchTopicPapers.mockResolvedValue(mockResolvedPapers1);

        // The route's expected data output
        const expectedOutput = {
            id: mockResolvedTopic.openalex_id,
            internalId: mockResolvedTopic.id,
            displayName: mockResolvedTopic.topic_display_name,
            description: mockResolvedTopic.topic_description,
            keywords: mockResolvedTopic.topic_keywords,
            wikipediaURL: mockResolvedTopic.topic_wikipedia_url,
            domain: {
                id: mockResolvedTopic.domain_openalex_id,
                name: mockResolvedTopic.domain_display_name
            },
            field: {
                id: mockResolvedTopic.field_openalex_id,
                name: mockResolvedTopic.field_display_name
            },
            subfield: {
                id: mockResolvedTopic.subfield_openalex_id,
                name: mockResolvedTopic.subfield_display_name
            },
            worksCount: mockResolvedTopic.works_count,
            citedByCount: mockResolvedTopic.cited_by_count,
            worksApiURL: mockResolvedTopic.works_api_url,
            createdAt: mockResolvedTopic.openalex_created_at,
            updatedAt: mockResolvedTopic.openalex_updated_at,

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

        const response = await request(app).get("/api/topics/T10102").expect(200);

        expect(fetchTopicById).toHaveBeenCalledWith("T10102");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedOutput);
    });

    // ------------- USER ERRORS ---------------

    it("Returns 400 when topic Id doesn't follow the correct format", async () => {
        fetchTopicById.mockResolvedValue(null);

        const response = await request(app).get("/api/topics/10102").expect(400);

        expect(fetchTopicById).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Invalid topic Id");
    });


    it("Returns 404 when the topic doesn't exist", async () => {
        fetchTopicById.mockResolvedValue(null);

        const response = await request(app).get("/api/topics/T1010").expect(404);

        expect(fetchTopicById).toHaveBeenCalledWith("T1010");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Topic not found");
    });

    // -------------- DATABASE ERRORS --------------

    it("Returns 500 when the server fails", async () => {
        fetchTopicById.mockRejectedValue(new Error("Unexpected failure"));

        const response = await request(app).get("/api/topics/T10102").expect(500);

        expect(fetchTopicById).toHaveBeenCalledWith("T10102");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Unexpected failure");
    });
});


const defaultPaginationResults = [...mockResolvedPapers1, ...mockResolvedPapers2];

describe("GET /api/topics/:id/papers", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- RETURNS PAPERS ASSOCIATED WITH THE TOPIC USING DEFAULT PAGINATION ----------

    it("Returns 200 and the papers associated with the topic for default pagination", async () => {
        fetchTopicById.mockResolvedValue(mockResolvedTopic);
        fetchTopicPapers.mockResolvedValue(defaultPaginationResults);

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

        const response = await request(app).get("/api/topics/T10102/papers")
        .query({
            page: null,
            limit: null
        })
        .expect(200);

        expect(fetchTopicById).toHaveBeenCalledWith("T10102");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(fetchTopicPapers).toHaveBeenCalledWith("8572", 10, 0);
        expect(fetchTopicPapers).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedOutput);
    });

    // ---------- RETURNS PAPERS ASSOCIATED WITH THE AUTHOR USING CUSTOM PAGINATION ----------

    it("Returns 200 and the papers associated with the topic for custom pagination", async () => {
        fetchTopicById.mockResolvedValue(mockResolvedTopic);
        fetchTopicPapers.mockResolvedValue(mockResolvedPapers2);

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

        const response = await request(app).get("/api/topics/T10102/papers")
        .query({
            page: 2,
            limit: 5
        })
        .expect(200);

        expect(fetchTopicById).toHaveBeenCalledWith("T10102");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(fetchTopicPapers).toHaveBeenCalledWith("8572", 5, 5);
        expect(fetchTopicPapers).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedOutput);
    });

    it("Returns 200 and an empty array when the pagination filters exceed the amount of papers", async () => {
        fetchTopicById.mockResolvedValue(mockResolvedTopic);
        fetchTopicPapers.mockResolvedValue([]);

        const response = await request(app).get("/api/topics/T10102/papers")
        .query({
            page: 5,
            limit: 10
        })
        .expect(200);

        expect(fetchTopicById).toHaveBeenCalledWith("T10102");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(fetchTopicPapers).toHaveBeenCalledWith("8572", 10, 40);
        expect(fetchTopicPapers).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual([]);
    });

    // ------------- USER ERRORS ---------------

    it("Returns 400 when the author id doesn't follow the correct format", async () => {
        const response = await request(app).get("/api/topics/10102/papers")
        .query({
            page: 5,
            limit: 10
        })
        .expect(400);

        expect(fetchTopicById).not.toHaveBeenCalled();
        expect(fetchTopicPapers).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Invalid topic Id");
    });

    it("Returns 400 when the page is not an integer", async () => {
        const response = await request(app).get("/api/topics/T10102/papers")
        .query({
            page: "first",
            limit: null
        })
        .expect(400);

        expect(fetchTopicById).not.toHaveBeenCalled();
        expect(fetchTopicPapers).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("'page' must be an integer");
    });

    it("Returns 400 when the page is an invalid number", async () => {
        const response = await request(app).get("/api/topics/T10102/papers")
        .query({
            page: 0,
            limit: null
        })
        .expect(400);

        expect(fetchTopicById).not.toHaveBeenCalled();
        expect(fetchTopicPapers).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("'page' must be greater than or equal to 1");
    });

    it("Returns 400 when the limit is not an integer", async () => {
        const response = await request(app).get("/api/topics/T10102/papers")
        .query({
            page: null,
            limit: "five"
        })
        .expect(400);

        expect(fetchTopicById).not.toHaveBeenCalled();
        expect(fetchTopicPapers).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("'limit' must be an integer");
    });

    it("Returns 400 when the limit is an invalid number", async () => {
        const response = await request(app).get("/api/topics/T10102/papers")
        .query({
            page: null,
            limit: 105
        })
        .expect(400);

        expect(fetchTopicById).not.toHaveBeenCalled();
        expect(fetchTopicPapers).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("'limit' must be between 1 and 100");
    });

    it("Returns 404 when the topic doesn't exist", async () => {
        fetchTopicById.mockResolvedValue(null);

        const response = await request(app).get("/api/topics/T1010/papers")
        .query({
            page: null,
            limit: null
        })
        .expect(404);

        expect(fetchTopicById).toHaveBeenCalledWith("T1010");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(fetchTopicPapers).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Topic not found");
    });

    // -------------- DATABASE ERRORS --------------

    it("Returns 500 when the server fails", async () => {
        fetchTopicById.mockResolvedValue(mockResolvedTopic);
        fetchTopicPapers.mockRejectedValue(new Error("Unexpected failure"));

        const response = await request(app).get("/api/topics/T10102/papers")
        .query({
            page: null,
            limit: null
        })
        .expect(500);

        expect(fetchTopicById).toHaveBeenCalledWith("T10102");
        expect(fetchTopicById).toHaveBeenCalledTimes(1);

        expect(fetchTopicPapers).toHaveBeenCalledWith("8572", 10, 0);
        expect(fetchTopicPapers).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Unexpected failure");
    });
});