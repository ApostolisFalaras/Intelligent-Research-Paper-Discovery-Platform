import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./../../src/config/db.js", () => ({
    default: {
        query: vi.fn()
    }
}));

import pool from "./../../src/config/db.js";
import { fetchUserSearchHistory,
         addToSearchHistory,
         deleteFromSearchHistory } from "../../src/repositories/userHistoryRepository.js";


const mockResolvedSearchHistory = [
    {
        id: 1,
        user_id: 1,
        query: "Software Engineering",
        filters: `{ "sort": "relevance", "toYear": 2018, "topicId": null, "fromYear": 2014, 
                   "language": null, "paperType": "article", "authorName": null, "isRetracted": false,
                   "isOpenAccess": true, "minCitations": 50, "hasContentPDF": null }`,
        result_count: 25,
        created_at: new Date("2026-05-14 09:41:19.170571+03")
    },
    {
        id: 2,
        user_id: 1,
        query: "Machine Learning",
        filters: `{ "sort": "impact", "toYear": 2025, "topicId": null, "fromYear": 2015, "language": null,
                   "paperType": null, "authorName": null, "isRetracted": false, "isOpenAccess": true,
                   "minCitations": null, "hasContentPDF": null }`,
        result_count: 15,
        created_at: new Date("2026-05-14 09:44:04.272394+03")
    },
];

// Helper function for query structure validation
function expectFetchHistoryQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM user_search_history");
    expect(query).toContain("WHERE user_id = $1");
    expect(query).toContain("ORDER BY created_at DESC");
    expect(query).toContain("LIMIT $2");
    expect(query).toContain("OFFSET $3;");
}


describe("fetchUserSearchHistory", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ------------- SUCCESSFUL RETRIEVAL OF USER SEARCH HISTORY, WHEN IT HAS/HASN'T RECORDS  ---------------

    it("Fetches the current user's search history", async () => {
        pool.query.mockResolvedValue({
            rows: mockResolvedSearchHistory
        });

        // Apply default pagination
        const result = await fetchUserSearchHistory(1, {page: 1, limit: 25, offset: 0});

        const [query, params] = pool.query.mock.calls[0];

        expectFetchHistoryQuery(query);
        expect(params).toEqual([1, 25, 0]);
        expect(result).toEqual(mockResolvedSearchHistory);
    });

    it("Fetches a user's empty search history with added pagination filters", async () => {
        pool.query.mockResolvedValue({
            rows: [],
        });

        // Apply pagination for this filter
        const result = await fetchUserSearchHistory(1, {page: 2, limit: 5, offset: 5});

        const [query, params] = pool.query.mock.calls[0];

        expectFetchHistoryQuery(query);
        expect(params).toEqual([1, 5, 5]);
        expect(result).toEqual([]);
    });

    // ------------- PROPAGATES DATABASE ERROR ---------------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchUserSearchHistory(1, {page: 1, limit: 25, offset: 0}))
        .rejects.
        toThrow("Unexpected DB error");

        // Although not neccesary, when pool.query fails
        // Validating the query structure and the query parameter
        const [query, params] = pool.query.mock.calls[0];

        expectFetchHistoryQuery(query);
        expect(params).toEqual([1, 25, 0]);
    });

});


// Test history record to be added
const searchHistoryRecord = {
    userId: 1,
    query: "Software Engineering",
    filters: {
        sort: "impact", 
        toYear: 2025, 
        topicId: null, 
        fromYear: 2015, 
        language: null,
        paperType: null, 
        authorName: null, 
        isRetracted: false, 
        isOpenAccess: true,
        minCitations: null, 
        hasContentPDF: null
    },
    resultsCount: 25 
};

function expectAddHistoryQuery(query) {
    expect(query).toContain("INSERT INTO user_search_history (user_id, query, filters, result_count)");
    expect(query).toContain("VALUES ($1, $2, $3, $4)");
    expect(query).toContain("RETURNING id, user_id;");
}

describe("addToSearchHistory", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ------------ SUCCESSFUL INSERTION OF SEARCH HISTORY RECORD ----------
    it("Inserts a new search history record", async () => {
        pool.query.mockResolvedValue({
            rows: [{ "id": 1, "user_id":1 }]
        });

        const result = await addToSearchHistory(
            searchHistoryRecord.userId,
            searchHistoryRecord.query,
            searchHistoryRecord.filters,
            searchHistoryRecord.resultsCount
        );

        const [query, params] = pool.query.mock.calls[0];

        expectAddHistoryQuery(query);
        expect(params).toEqual([searchHistoryRecord.userId, searchHistoryRecord.query, 
                                JSON.stringify(searchHistoryRecord.filters), searchHistoryRecord.resultsCount]);
        
        expect(result).toEqual({ "id": 1, "user_id": 1 });
    });


    // ------------- PROPAGATES DATABASE ERROR ---------------

    it("An unexpected database error occurs during insertion of a search history record", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(addToSearchHistory(
            searchHistoryRecord.userId,
            searchHistoryRecord.query,
            searchHistoryRecord.filters,
            searchHistoryRecord.resultsCount
        ))
        .rejects
        .toThrow("Unexpected DB error");

        const [query, params] = pool.query.mock.calls[0];

        expectAddHistoryQuery(query);
        expect(params).toEqual([searchHistoryRecord.userId, searchHistoryRecord.query, 
                                JSON.stringify(searchHistoryRecord.filters), searchHistoryRecord.resultsCount]);
    
    });
});


function expectDeleteHistoryQuery(query) {
    expect(query).toContain("DELETE FROM user_search_history");
    expect(query).toContain("WHERE user_id = $1 AND id = $2;");
}

describe("deleteFromSearchHistory", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ------------ SUCCESSFUL DELETION OF SEARCH HISTORY RECORD ----------

    it("Deletes a search history record", async () => {
        pool.query.mockResolvedValue({
            rowCount: 1
        });

        const result = await deleteFromSearchHistory(1, 1);

        const [query, params] = pool.query.mock.calls[0];

        expectDeleteHistoryQuery(query);
        expect(params).toEqual([1, 1]);
        expect(result).toBe(1);
    });

    // ------------ UNSUCCESSFUL DELETION OF SEARCH HISTORY RECORD WHEN IT DOESN'T EXIST ----------

    it("Deletes 0 search history records when it doesn't exist", async () => {
        pool.query.mockResolvedValue({
            rowCount: 0
        });

        const result = await deleteFromSearchHistory(1, 1000);

        const [query, params] = pool.query.mock.calls[0];

        expectDeleteHistoryQuery(query);
        expect(params).toEqual([1, 1000]);
        expect(result).toBe(0);
    });

    // ------------- PROPAGATES DATABASE ERROR ---------------

    it("An unexpected database error occurs during deletion of a search history record", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(deleteFromSearchHistory(1,1))
        .rejects.
        toThrow("Unexpected DB error");

        // Although not neccesary, when pool.query fails
        // Validating the query structure and the query parameter
        const [query, params] = pool.query.mock.calls[0];

        expectDeleteHistoryQuery(query);
        expect(params).toEqual([1, 1]);
    });

});
