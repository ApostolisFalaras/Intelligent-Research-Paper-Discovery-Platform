import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("./../../src/repositories/userHistoryRepository.js", () => ({
    fetchUserSearchHistory: vi.fn(),
	deleteFromSearchHistory: vi.fn()
}));

// Middleware has to be mocked to authenticate the only existing user in the current tests
let mockAuthenticatedUser = {id: 1};

vi.mock("./../../src/middlewares/authMiddleware.js", async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        authMiddleware: (req, res, next) => {
            req.user = mockAuthenticatedUser;
            next();
        }
    }
});

import { deleteFromSearchHistory, fetchUserSearchHistory } from "../../src/repositories/userHistoryRepository.js";
import { authMiddleware } from "../../src/middlewares/authMiddleware.js";
import app from "../../src/app.js";


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


describe("GET /api/users/me/search-history", () => {
    beforeEach(() => {
        vi.resetAllMocks();
		mockAuthenticatedUser = {id: 1};
    });

    // ------------ SUCCESSFUL SEARCH HISTORY RETRIEVAL ------------

    it("Returns 200 when search history is successfully retrieved", async () => {
        fetchUserSearchHistory.mockResolvedValue(mockResolvedSearchHistory);

        const response = await request(app).get("/api/users/me/search-history").expect(200);

        const expectedOutput = mockResolvedSearchHistory.map((record) => ({
            id: record.id,
            userId: record.user_id,
            query: record.query,
            filters: record.filters,
            resultCount: record.result_count,
            createdAt: record.created_at.toISOString()
        }));

        expect(fetchUserSearchHistory).toHaveBeenCalledWith(1, {page: 1, limit: 25, offset: 0});
        expect(fetchUserSearchHistory).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual({ 
            history: expectedOutput 
        });
    });

    // ------------ SUCCESSFUL RETRIEVAL OF EMPTY ARRAY OF HISTORY RECORDS ------------

    it("Returns 200 and an empty array when the search history is empty", async () => {
        fetchUserSearchHistory.mockResolvedValue([]);

        const response = await request(app).get("/api/users/me/search-history").expect(200);

        expect(fetchUserSearchHistory).toHaveBeenCalledWith(1, {page: 1, limit: 25, offset: 0});
        expect(fetchUserSearchHistory).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual({ 
            history: [] 
        });
    });

    // ------------- TESTING CUSTOM PAGINATION FILTERS ---------------

    it("Returns 200 for custom pagination filters", async () => {
        fetchUserSearchHistory.mockResolvedValue([]);

        const response = await request(app)
		.get("/api/users/me/search-history")
		.query({ page: 2, limit: 30 })
		.expect(200);

        expect(fetchUserSearchHistory).toHaveBeenCalledWith(1, {page: 2, limit: 30, offset: 30});
        expect(fetchUserSearchHistory).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual({ 
            history: [] 
        });
    });

    // ------------- MISSING/INVALID USER ID ---------------
    // Assuming default pagination

    it("Returns 400 when user id is missing", async () => {
        mockAuthenticatedUser = {id: null};

        const response = await request(app).get("/api/users/me/search-history").expect(400);

        expect(fetchUserSearchHistory).not.toHaveBeenCalled();
        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Missing/Invalid user_id");
    });


    it("Returns 400 when user id is invalid", async () => {
        mockAuthenticatedUser = {id: "one"};

        const response = await request(app).get("/api/users/me/search-history").expect(400);

        expect(fetchUserSearchHistory).not.toHaveBeenCalled();
        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Missing/Invalid user_id");
    });

    // ------------ INVALID PAGINATION FILTERS -----------

    it("Returns 400 when the page filter is invalid", async () => {
        const response = await request(app)
        .get("/api/users/me/search-history")
        .query({page: 0, limit: 30})
        .expect(400);

        expect(fetchUserSearchHistory).not.toHaveBeenCalled();
        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("'page' must be greater than or equal to 1");
    });

    it("Returns 400 when the limit filter is invalid", async () => {
        const response = await request(app)
        .get("/api/users/me/search-history")
        .query({page: 1, limit: 150})
        .expect(400);

        expect(fetchUserSearchHistory).not.toHaveBeenCalled();
        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("'limit' must be between 1 and 100");
    });

    // ------------ DATABASE ERROR --------------

    it("Returns 500 when there's an unexpected DB error", async () => {
        fetchUserSearchHistory.mockRejectedValue(new Error("Database query failed"));

        const response = await request(app).get("/api/users/me/search-history").expect(500);

        expect(fetchUserSearchHistory).toHaveBeenCalledWith(1, {page: 1, limit: 25, offset: 0});
        expect(fetchUserSearchHistory).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Database query failed");
    });
});


describe("DELETE /api/users/me/search-history/:id", () => {
    beforeEach(() => {
        vi.resetAllMocks();
		mockAuthenticatedUser = {id: 1};
    });

	// ---------- SUCCESSFUL DELETION OF A SINGLE SEARCH HISTORY RECORD ----------

	it("Returns 200 when a single search history record is deleted", async () => {
		deleteFromSearchHistory.mockResolvedValue(1);

		const response = await request(app).delete("/api/users/me/search-history/1").expect(200);

		expect(deleteFromSearchHistory).toHaveBeenCalledWith(1, 1);
		expect(deleteFromSearchHistory).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("success");
		expect(response.body.message).toBe("Search history record deleted successfully");
	});

	// ---------- UNSUCCESSFUL DELETION OF NON-EXISTENT SEARCH HISTORY RECORD ---------

	it("Returns 404 when the single search history record already doesn't exist", async () => {
		deleteFromSearchHistory.mockResolvedValue(0);

		const response = await request(app).delete("/api/users/me/search-history/2").expect(404);

		expect(deleteFromSearchHistory).toHaveBeenCalledWith(1, 2);
		expect(deleteFromSearchHistory).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Search history record not found");
	});

	// ---------- MISSING/INVALID PROJECT FOLDER ID ----------

	it("Returns 400 when search history record id is missing", async () => {

		const response = await request(app)
		.delete("/api/users/me/search-history/abc")
		.expect(400);		

		expect(deleteFromSearchHistory).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("'history record id' must be an integer");
	});

	it("Returns 400 when search history record id is missing", async () => {

		const response = await request(app)
		.delete("/api/users/me/search-history/0")
		.expect(400);		

		expect(deleteFromSearchHistory).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Search history record id is required");
	});

	// ---------- MISSING USER ID ----------

	it("Returns 400 when user id is missing", async () => {
		mockAuthenticatedUser = {id: null};

		const response = await request(app)
		.delete("/api/users/me/search-history/1")
		.expect(400);		

		expect(deleteFromSearchHistory).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Missing/Invalid user_id");
	});

	// ----------- DATABASE ERROR -----------

	it("Returns 500 when there's an unexpected DB error", async () => {
        deleteFromSearchHistory.mockRejectedValue(new Error("Database query failed"));

        const response = await request(app).delete("/api/users/me/search-history/1").expect(500);

        expect(deleteFromSearchHistory).toHaveBeenCalledWith(1, 1);
        expect(deleteFromSearchHistory).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Database query failed");
    });
});