import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./../../src/repositories/userHistoryRepository.js", () => ({
    fetchUserSearchHistory: vi.fn(),
    addToSearchHistory: vi.fn(),
    deleteFromSearchHistory: vi.fn()
}));


import { getUserSearchHistory, deleteUserSearchHistoryById } from "../../src/services/userService.js";
import { addToSearchHistory, deleteFromSearchHistory, fetchUserSearchHistory } from "../../src/repositories/userHistoryRepository.js";


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


describe("getUserSearchHistory", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ------------- SUCCESSFUL RETRIEVAL OF USER SEARCH HISTORY, WHEN IT HAS/HASN'T RECORDS  ---------------

	it("Returns the search history for a particular user", async () => {
		fetchUserSearchHistory.mockResolvedValue(mockResolvedSearchHistory);

		const expectedOutput = mockResolvedSearchHistory.map((record) => ({
			id: record.id,
			userId: record.user_id,
			query: record.query,
			filters: record.filters,
			resultCount: record.result_count,
			createdAt: record.created_at
		}));

		// Assuming req.user.id = 1, default pagination filters (null)
		const result = await getUserSearchHistory(1, null);

		expect(fetchUserSearchHistory).toHaveBeenCalledWith(1, { page: 1, limit: 25, offset: 0});
		expect(fetchUserSearchHistory).toHaveBeenCalledTimes(1);

		expect(result).toEqual(expectedOutput);
	});

	it("Returns an empty list when the user hasn't made any search queries yet", async () => {
		fetchUserSearchHistory.mockResolvedValue([]);

		// Assuming req.user.id = 1, default pagination filters (null)
		const result = await getUserSearchHistory(1, null);

		expect(fetchUserSearchHistory).toHaveBeenCalledWith(1, { page: 1, limit: 25, offset: 0 });
		expect(fetchUserSearchHistory).toHaveBeenCalledTimes(1);

		expect(result).toEqual([]);
	});

	// ------------- CUSTOM PAGINATION FILTERS ---------------

	it("Returns an empty list for non-default pagination filters", async () => {
		fetchUserSearchHistory.mockResolvedValue([]);

		// Assuming req.user.id = 1, default pagination filters (null)
		const result = await getUserSearchHistory(1, { page: 2, limit: 30 });

		expect(fetchUserSearchHistory).toHaveBeenCalledWith(1, { page: 2, limit: 30, offset: 30 });
		expect(fetchUserSearchHistory).toHaveBeenCalledTimes(1);

		expect(result).toEqual([]);
	});

	// ------------- MISSING/INVALID USER ID ---------------

	it("Throws 400 when the user id is missing", async () => {
		await expect(getUserSearchHistory(null, {page: 1, limit: 5}))
		.rejects
		.toThrow("Missing/Invalid user_id");

		expect(fetchUserSearchHistory).not.toHaveBeenCalled();
	});

	it("Throws 400 when the user id is invalid", async () => {
		await expect(getUserSearchHistory("2", {page: 1, limit: 5}))
		.rejects
		.toThrow("Missing/Invalid user_id");

		expect(fetchUserSearchHistory).not.toHaveBeenCalled();
	});

	// ------------- INVALID PAGINATION FILTERS ---------------

	it("Throws 400 when the page filter is invalid", async () => {
		await expect(getUserSearchHistory(1, { page: 0, limit: 30 }))
		.rejects
		.toThrow("'page' must be greater than or equal to 1");

		expect(fetchUserSearchHistory).not.toHaveBeenCalled();
	});

	it("Throws 400 when the limit filter is invalid", async () => {
		// The same applies if limit < 1
		await expect(getUserSearchHistory(1, { page: 2, limit: 105 }))
		.rejects
		.toThrow("'limit' must be between 1 and 100");

		expect(fetchUserSearchHistory).not.toHaveBeenCalled();
	});

	// ------------- PROPAGATES REPOSITORY ERROR ---------------

	it("Propagates repository error", async () => {
		fetchUserSearchHistory.mockRejectedValue(new Error("Database query failed"));

		await expect(getUserSearchHistory(1, null)).rejects.toThrow("Database query failed");

		expect(fetchUserSearchHistory).toHaveBeenCalledWith(1, { page: 1, limit: 25, offset: 0 });
		expect(fetchUserSearchHistory).toHaveBeenCalledTimes(1);
	});
});


describe("deleteUserSearchHistoryById", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ------------- SUCCESSFUL DELETION OF USER SEARCH HISTORY RECORD ---------------

	it("Deletes a single user search history record", async () => {
		deleteFromSearchHistory.mockResolvedValue(1);

		await deleteUserSearchHistoryById(1, 1);

		expect(deleteFromSearchHistory).toHaveBeenCalledWith(1, 1);
		expect(deleteFromSearchHistory).toHaveBeenCalledTimes(1);
		
	});
	// ------------- FAILED DELETION OF INEXISTENT SEARCH HISTORY RECORD ---------------

	it("Throws 404 when the user tries to delete a non-existent search history record", async () => {
		deleteFromSearchHistory.mockResolvedValue(0);

		await expect(deleteUserSearchHistoryById(1,1))
		.rejects
		.toThrow("Search history record not found");

		expect(deleteFromSearchHistory).toHaveBeenCalledWith(1, 1);
		expect(deleteFromSearchHistory).toHaveBeenCalledTimes(1);
	});
	

	// ------------- MISSING/INVALID USER ID ---------------

	it("Throws 400 when the user id is missing", async () => {
		await expect(deleteUserSearchHistoryById(null, 1))
		.rejects
		.toThrow("Missing/Invalid user_id");

		expect(deleteFromSearchHistory).not.toHaveBeenCalled();
	});

	it("Throws 400 when the user id is invalid", async () => {
		await expect(deleteUserSearchHistoryById("2", 1))
		.rejects
		.toThrow("Missing/Invalid user_id");

		expect(deleteFromSearchHistory).not.toHaveBeenCalled();
	});

	// ------------- MISSING/INVALID SEARCH HISTORY RECORD ID ---------------

	it("Throws 400 when the search history record id is missing", async () => {
		await expect(deleteUserSearchHistoryById(1, null))
		.rejects
		.toThrow("Search history record id is required");

		expect(deleteFromSearchHistory).not.toHaveBeenCalled();
	});

	it("Throws 400 when the search history record id is invalid", async () => {
		await expect(deleteUserSearchHistoryById(1, "first"))
		.rejects
		.toThrow("'history record id' must be an integer");

		expect(deleteFromSearchHistory).not.toHaveBeenCalled();
	});

	// ------------- PROPAGATES REPOSITORY ERROR ---------------

	it("Propagates repository error", async () => {
		deleteFromSearchHistory.mockRejectedValue(new Error("Database query failed"));

		await expect(deleteUserSearchHistoryById(1, 1)).rejects.toThrow("Database query failed");

		expect(deleteFromSearchHistory).toHaveBeenCalledWith(1, 1);
		expect(deleteFromSearchHistory).toHaveBeenCalledTimes(1);
	});
});