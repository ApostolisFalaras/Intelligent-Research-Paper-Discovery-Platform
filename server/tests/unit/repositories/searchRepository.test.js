import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository function the fetches a paper by id
vi.mock("../../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    }
}));

// Import after to replace the real function with the mock function
import pool from "../../../src/config/db.js";
import { searchPapersByTextQuery } from "../../../src/repositories/searchRepository.js";

// Aggregating default filters in one place
const defaultFilters = {
    fromYear: null,
    toYear: null,
    language: null,
    paperType: null,
    minCitations: null,
    topicId: null,
    authorName: null,
    isOpenAccess: true,
    hasContentPDF: null,
    isRetracted: false,
    sort: "relevance",
    page: 1,
    limit: 25,
    offset: 0
};

// Helper function to assert a query with DEFAULT filters
function expectDefaultCountQuery(query) {
    expect(query).toContain("SELECT COUNT(DISTINCT p.id) AS total_results");
    expect(query).toContain("FROM papers p");
    expect(query).toContain("LEFT JOIN paper_authors pa ON pa.paper_id = p.id");
    expect(query).toContain("WHERE p.search_vector @@ websearch_to_tsquery('english', $1)");
    expect(query).toContain("p.is_open_access = $2");
    expect(query).toContain("p.is_retracted = $3");
}

function expectDefaultSearchQuery(query) {
    expect(query).toContain("SELECT");
    expect(query).toContain("FROM papers p");
    expect(query).toContain("LEFT JOIN paper_authors pa ON pa.paper_id = p.id");
    expect(query).toContain("WHERE p.search_vector @@ websearch_to_tsquery('english', $1)");
    expect(query).toContain("p.is_open_access = $2");
    expect(query).toContain("p.is_retracted = $3");
    expect(query).toContain("ORDER BY rank DESC NULLS LAST, p.cited_by_count DESC NULLS LAST");
    expect(query).toContain("LIMIT $4");
    expect(query).toContain("OFFSET $5;");
}


const mockRows1 = [
    {
        id: "830837",
        openalex_id: "W3108235655",
        title: "Python Machine Learning: Machine Learning and Deep Learning with Python, scikit-learn, and TensorFlow",
        display_name: "Python Machine Learning: Machine Learning and Deep Learning with Python, scikit-learn, and TensorFlow",
        abstract: null,
        publication_year: 2019,
        cited_by_count: 262,
        fwci: "13.0741",
        primary_source_display_name: null,
        primary_topic_display_name: "Computational Physics and Python Applications",
        is_open_access: false,
        open_access_status: "closed",
        rank: "1",
        author_count: "1",
        authors_preview: [
            {"id": "A5110726461", "name": "Samuel Burns"}
        ]
    },
    {
        id: "830874",
        openalex_id: "W2909369566",
        title: "Python machine learning : machine learning and deep learning with Python, scikit-learn, and TensorFlow",
        display_name: "Python machine learning : machine learning and deep learning with Python, scikit-learn, and TensorFlow",
        abstract: "Python Machine Learning, Third Edition is a ...",
        publication_year: 2017,
        cited_by_count: 245,
        fwci: "8.3621",
        primary_source_display_name: null,
        primary_topic_display_name: "Computational Physics and Python Applications",
        is_open_access: false,
        open_access_status: "closed",
        rank: "1",
        author_count: "2",
        authors_preview: [
            { "id": "A5053156269", "name": "Sebastian Raschka" },
            { "id": "A5056930369", "name": "Vahid Mirjalili" }
        ]
    }
];

const mockRows2 = [
    {
        id: "864364",
        openalex_id: "W3215633082",
        title: "Transformational machine learning: Learning how to learn from many related scientific problems",
        display_name: "Transformational machine learning: Learning how to learn from many related scientific problems",
        abstract: "Almost all machine learning (ML) is based on representing examples...",
        publication_year: 2021,
        cited_by_count: 35,
        fwci: "4.0595",
        primary_source_display_name: "Proceedings of the National Academy of Sciences",
        primary_topic_display_name: "Machine Learning and Data Classification",
        is_open_access: true,
        open_access_status: "hybrid",
        rank: "0.9999973",
        author_count: "7",
        authors_preview: [
            {"id": "A5028083196", "name": "Iván Olier"},
            {"id": "A5084132314", "name": "Oghenejokpeme I. Orhobor"}
        ]
    },
    {
        id: "838182",
        openalex_id: "W4400556081",
        title: "Hybrid Quantum-Classical Machine Learning Models: Powering the Future of AI",
        display_name: "Hybrid Quantum-Classical Machine Learning Models: Powering the Future of AI",
        abstract: "The burgeoning field of machine learning has transformed numerous sectors, ...",
        publication_year: 2023,
        cited_by_count: 30,
        fwci: "5.2198",
        primary_source_display_name: "Journal of Science & Technology",
        primary_topic_display_name: "Quantum Computing Algorithms and Architecture",
        is_open_access: true,
        open_access_status: "diamond",
        rank: "0.99999547",
        author_count: "1",
        authors_preview: [
            { "id": "A5093749371", "name": "Mohan Raja Pulicharla" },
        ]
    }
];

const mockRows3 = [
    {
        id: "405200",
        openalex_id: "W2163851162",
        title: "Preliminary guidelines for empirical research in software engineering",
        display_name: "Preliminary guidelines for empirical research in software engineering",
        abstract: "Empirical software engineering research needs research guidelines to improve...",
        publication_year: 2002,
        cited_by_count: 1493,
        fwci: "86.9251",
        primary_source_display_name: "IEEE Transactions on Software Engineering",
        primary_topic_display_name: "Software Engineering Research",
        is_open_access: true,
        open_access_status: "green",
        rank: "0.999706",
        author_count: "6",
        authors_preview: [
            { "id": "A5012102325", "name": "Barbara Kitchenham" },
            { "id": "A5109245255", "name": "Shari Lawrence Pfleeger"}
        ]
    },
    {
        id: "50376",
        openalex_id: "W2010608861",
        title: "Suggesting accurate method and class names",
        display_name: "Suggesting accurate method and class names",
        abstract: "Descriptive names are a vital part of readable, and hence maintainable, code. Recent progress...",
        publication_year: 2015,
        cited_by_count: 386,
        fwci: "79.0533",
        primary_source_display_name: null,
        primary_topic_display_name: "Software Engineering Researc",
        is_open_access: true,
        open_access_status: "green",
        rank: "0.39641288",
        author_count: "4",
        authors_preview: [
            { "id": "A5080221214", "name": "Miltiadis Allamanis" },
            { "id": "A5076587279", "name": "Earl T. Barr" }
        ]
    }
];


describe("searchPapersByTextQuery", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Queries the DB with the default filters", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{total_results: 2}]})
            .mockResolvedValueOnce({ rows: mockRows1 });

        const results = await searchPapersByTextQuery({
            ...defaultFilters,
            query: "Machine Learning"
        });

        // Validating the query structure and the query parameter
        const [countQuery, countParams] = pool.query.mock.calls[0];
        const [searchQuery, searchParams] = pool.query.mock.calls[1];
        
        expectDefaultCountQuery(countQuery);
        expect(countParams).toEqual(["Machine Learning", true, false]);

        expectDefaultSearchQuery(searchQuery);
        expect(searchParams).toEqual(["Machine Learning", true, false, 25, 0]);
            
        expect(pool.query).toHaveBeenCalledTimes(2);
        expect(results).toEqual({
            totalResults: 2,
            papers: mockRows1
        });
    });


    it("Queries the DB with the default filters and retrieves an empty array", async () => {
        // No matching papers for the query
        pool.query
            .mockResolvedValueOnce({ rows: [{total_results: 0}]})
            .mockResolvedValueOnce({ rows: [] });

        const results = await searchPapersByTextQuery({
            ...defaultFilters,
            query: "Unknown query",
        });


        // Validating the query structure and the query parameter
        const [countQuery, countParams] = pool.query.mock.calls[0];
        const [searchQuery, searchParams] = pool.query.mock.calls[1];

        expectDefaultCountQuery(countQuery);
        expect(countParams).toEqual(["Unknown query", true, false]);

        expectDefaultSearchQuery(searchQuery);
        expect(searchParams).toEqual(["Unknown query", true, false, 25, 0]);
            
        expect(pool.query).toHaveBeenCalledTimes(2);
        expect(results).toEqual({
            totalResults: 0,
            papers: []
        });
    });

    // ------------ QUERIES WITH FILTERS --------------

    // An arbitrary combination of filters including PAGINATION
    it("Queries the DB with fromYear, toYear, paperType, and Pagination filters", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{total_results: 2}]})
            .mockResolvedValueOnce({ rows: mockRows2,});

        const results = await searchPapersByTextQuery({
            ...defaultFilters,
            query: "Machine Learning",
            fromYear: 2015,
            toYear: 2025,
            paperType: "article",
            page: 2,
            limit: 2,
        });

        const [countQuery, countParams] = pool.query.mock.calls[0];
        const [searchQuery, searchParams] = pool.query.mock.calls[1];

        expect(countQuery).toContain("SELECT");
        expect(countQuery).toContain("FROM papers p");
        expect(countQuery).toContain("LEFT JOIN paper_authors pa ON pa.paper_id = p.id");
        expect(countQuery).toContain("WHERE p.search_vector @@ websearch_to_tsquery('english', $1)");
        expect(countQuery).toContain("p.publication_year >= $2");
        expect(countQuery).toContain("p.publication_year <= $3");
        expect(countQuery).toContain("p.paper_type = $4");
        expect(countQuery).toContain("p.is_open_access = $5");
        expect(countQuery).toContain("p.is_retracted = $6");

        expect(countParams).toEqual(["Machine Learning", 2015, 2025, "article", true, false]);

        expect(searchQuery).toContain("SELECT");
        expect(searchQuery).toContain("FROM papers p");
        expect(searchQuery).toContain("LEFT JOIN paper_authors pa ON pa.paper_id = p.id");
        expect(searchQuery).toContain("WHERE p.search_vector @@ websearch_to_tsquery('english', $1)");
        expect(searchQuery).toContain("p.publication_year >= $2");
        expect(searchQuery).toContain("p.publication_year <= $3");
        expect(searchQuery).toContain("p.paper_type = $4");
        expect(searchQuery).toContain("p.is_open_access = $5");
        expect(searchQuery).toContain("p.is_retracted = $6");
        expect(searchQuery).toContain("ORDER BY rank DESC NULLS LAST, p.cited_by_count DESC NULLS LAST");
        expect(searchQuery).toContain("LIMIT $7");
        expect(searchQuery).toContain("OFFSET $8;");

        expect(pool.query).toHaveBeenCalledTimes(2);

        expect(searchParams).toEqual(["Machine Learning", 2015, 2025, "article", true, false, 2, 0]);
        expect(results).toEqual({
            totalResults: 2,
            papers: mockRows2
        });
    });

    it("Queries the DB with minCitations, topicId, and Sorting filters", async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{total_results: 2}]})
            .mockResolvedValue({ rows: mockRows3 });

        const results = await searchPapersByTextQuery({
            ...defaultFilters,
            query: "Software engineering",
            minCitations: 50,
            topicId: "T10260",
            sort: "impact"
        });

        const [countQuery, countParams] = pool.query.mock.calls[0];
        const [searchQuery, searchParams] = pool.query.mock.calls[1];

        expect(searchQuery).toContain("SELECT");
        expect(searchQuery).toContain("FROM papers p");
        expect(searchQuery).toContain("LEFT JOIN paper_authors pa ON pa.paper_id = p.id");
        expect(searchQuery).toContain("WHERE p.search_vector @@ websearch_to_tsquery('english', $1)");
        expect(searchQuery).toContain("p.cited_by_count >= $2");
        expect(searchQuery).toContain("p.primary_topic_openalex_id = $3");
        expect(searchQuery).toContain("p.is_open_access = $4");
        expect(searchQuery).toContain("p.is_retracted = $5");
        expect(searchQuery).toContain("ORDER BY p.fwci DESC NULLS LAST, p.cited_by_count DESC NULLS LAST, rank DESC NULLS LAST");
        expect(searchQuery).toContain("LIMIT $6");
        expect(searchQuery).toContain("OFFSET $7;");

        expect(pool.query).toHaveBeenCalledTimes(2);

        expect(searchParams).toEqual(["Software engineering", 50, "T10260", true, false, 25, 0]);
        expect(results).toEqual({
            totalResults: 2,
            papers: mockRows3
        });
    });

    // ------------ DATABASE ERROR --------------

    it("An unexpected database error occurs", async () => {
        // The total rows were retrieved by the query that actally fetches the results fails
        pool.query
            .mockResolvedValueOnce({rows: [{total_results: 2}]})
            .mockRejectedValueOnce(new Error("Unexpected DB error"));

        const result = await expect(searchPapersByTextQuery({
                ...defaultFilters,
                query: "Machine Learning"
            })
        )
        .rejects.toThrow("Unexpected DB error");

        // Although not neccesary, when pool.query fails
        // Validating the query structure and the query parameter
        const [countQuery, countParams] = pool.query.mock.calls[0];

        expectDefaultCountQuery(countQuery);
        expect(countParams).toEqual(["Machine Learning", true, false]);
    });
});