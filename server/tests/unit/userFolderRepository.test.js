import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./../../src/config/db.js", () => ({
	default: {
		query: vi.fn()
	}
}));

import pool from "./../../src/config/db.js";
import { fetchProjectFoldersById,
	     createProjectFolder,
		 updateProjectFolder,
		 deleteProjectFolder,
		 fetchPapersFromFolderById } from "./../../src/repositories/userFolderRepository.js";


const mockResolvedProjectFolders = [
	{
		id: 1,
        user_id: 1,
        name: "Generative AI",
        summary: "Research on LLMs and RAG pipelines",
        is_pinned: true,
        visibility: "public",
        color: "blue",
        icon: "no-icon",
        paper_count: 0,
        created_at: new Date("2026-05-23 16:20:16.759277+03"),
        updated_at: new Date("2026-05-23 16:20:16.759277+03")
	},
	{
		id: 2,
        user_id: 1,
        name: "CyberSecurity",
        summary: "TOP SECRET",
        is_pinned: false,
        visibility: "private",
        color: "red",
        icon: "no-icon",
        paper_count: 0,
        created_at: new Date("2026-05-23 16:20:16.759277+03"),
        updated_at: new Date("2026-05-23 16:20:16.759277+03")
	}
];


// Helper function for query structure validation
function expectFetchFoldersQuery(query) {
    expect(query).toContain("SELECT *");
    expect(query).toContain("FROM user_folders");
    expect(query).toContain("WHERE user_id = $1");
}

describe("fetchProjectFoldersById", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ------------- SUCCESSFUL RETRIEVAL OF USER PROJECT FOLDERS ---------------

	it("Fetches the current user's project folders", async () => {
		pool.query.mockResolvedValue({
			rows: mockResolvedProjectFolders
		});

		const results = await fetchProjectFoldersById(1);

		const [query, params] = pool.query.mock.calls[0];

		expectFetchFoldersQuery(query);
		expect(params).toEqual([1]);
		expect(results).toEqual(mockResolvedProjectFolders);
	});

	it("Fetches an empty array when user has no folders", async () => {
		pool.query.mockResolvedValue({
			rows:[]
		});

		const results = await fetchProjectFoldersById(1);

		const [query, params] = pool.query.mock.calls[0];

		expectFetchFoldersQuery(query);
		expect(params).toEqual([1]);
		expect(results).toEqual([]);
	});

	// ------------- PROPAGATES DATABASE ERROR ---------------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchProjectFoldersById(1))
        .rejects.
        toThrow("Unexpected DB error");

        // Although not neccesary, when pool.query fails
        // Validating the query structure and the query parameter
        const [query, params] = pool.query.mock.calls[0];

        expectFetchFoldersQuery(query);
        expect(params).toEqual([1]);
    });
});


// Test folder 
const newProjectFolder = {
	name: mockResolvedProjectFolders[0].name,
	summary: mockResolvedProjectFolders[0].summary,
	visibility: mockResolvedProjectFolders[0].visibility,
	color: mockResolvedProjectFolders[0].color,
	icon: mockResolvedProjectFolders[0].icon,
	isPinned: mockResolvedProjectFolders[0].is_pinned,
};

// Helper function for query structure validation
function expectCreateFolderQuery(query) {
	expect(query).toContain("INSERT INTO user_folders (user_id, name, summary, is_pinned, visibility, color, icon)");
	expect(query).toContain("VALUES ($1, $2, $3, $4, $5, $6, $7);");
}

describe("createProjectFolder", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ----------- SUCCESSFUL CREATION OF PROJECT FOLDER ------------

	it("Creates a new project folder", async () => {
		pool.query.mockResolvedValue({
			rowCount: 1
		});

		const result = await createProjectFolder(1, newProjectFolder);

		const [query, params] = pool.query.mock.calls[0];

		const values = [
			1, 
			newProjectFolder.name,
			newProjectFolder.summary,
			newProjectFolder.isPinned,
			newProjectFolder.visibility,
			newProjectFolder.color,
			newProjectFolder.icon,
		];

        expectCreateFolderQuery(query);
        expect(params).toEqual(values);
		expect(result).toBe(1);
	});

	it("Returns 0 when the new project folder couldn't be created", async () => {
		pool.query.mockResolvedValue({
			rowCount: 0
		});

		const result = await createProjectFolder(1, newProjectFolder);

		const [query, params] = pool.query.mock.calls[0];

		const values = [
			1, 
			newProjectFolder.name,
			newProjectFolder.summary,
			newProjectFolder.isPinned,
			newProjectFolder.visibility,
			newProjectFolder.color,
			newProjectFolder.icon,
		];

        expectCreateFolderQuery(query);
        expect(params).toEqual(values);
		expect(result).toBe(0);
	});


	// ------------- PROPAGATES DATABASE ERROR ---------------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(createProjectFolder(1, newProjectFolder))
        .rejects.
        toThrow("Unexpected DB error");

        // Although not neccesary, when pool.query fails
        // Validating the query structure and the query parameter
        const [query, params] = pool.query.mock.calls[0];

        expectCreateFolderQuery(query);

		const values = [
			1, 
			newProjectFolder.name,
			newProjectFolder.summary,
			newProjectFolder.isPinned,
			newProjectFolder.visibility,
			newProjectFolder.color,
			newProjectFolder.icon,
		];
        expect(params).toEqual(values);
    });
});


// Updating 4 out of 6 metadata fields
const updateData = {
    name: "Cyber Security",
    summary: "This project folder refers to cybersecurity topics including....",
    color: "blue",
    visibility: "shared"
};

function expectUpdateFolderQuery(query, numFields) {
	expect(query).toContain("UPDATE user_folders");
	expect(query).toContain("SET");
	expect(query).toContain("updated_at = CURRENT_TIMESTAMP");
	expect(query).toContain(`WHERE user_id = $${numFields-1} AND id = $${numFields}`);
}

describe("updateProjectFolder", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL PROJECT FOLDER UPDATE ------------

	it("Updates project folder data", async () => {
		pool.query.mockResolvedValue({
			rowCount: 1
		});

		const result = await updateProjectFolder(1, 2, updateData);

		const [query, params] = pool.query.mock.calls[0];

		// Using the number of fields to determine the last two database protocol placeholders, e.g. $4, $5,...
		const numFields = Object.keys(params).length;
		expectUpdateFolderQuery(query, numFields);

		expect(params).toEqual([
			updateData.name, updateData.summary, updateData.visibility, updateData.color, 1, 2
		]);
		expect(result).toBe(1);
	});

	// ---------- UNSUCCESSFUL PROJECT FOLDER UPDATE WHEN FOLDER DOESN'T EXIST ------------

	it("Returns 0 when project folder doesn't exist", async () => {
		pool.query.mockResolvedValue({
			rowCount: 0
		});

		const result = await updateProjectFolder(1, 2, updateData);

		const [query, params] = pool.query.mock.calls[0];

		// Using the number of fields to determine the last two database protocol placeholders, e.g. $4, $5,...
		const numFields = Object.keys(params).length;
		expectUpdateFolderQuery(query, numFields);

		expect(params).toEqual([
			updateData.name, updateData.summary, updateData.visibility, updateData.color, 1, 2
		]);
		expect(result).toBe(0);
	});


	// ------------- PROPAGATES DATABASE ERROR ---------------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(updateProjectFolder(1, 2, updateData))
        .rejects.
        toThrow("Unexpected DB error");

        // Although not neccesary, when pool.query fails
        // Validating the query structure and the query parameter
        const [query, params] = pool.query.mock.calls[0];

        // Using the number of fields to determine the last two database protocol placeholders, e.g. $4, $5,...
		const numFields = Object.keys(params).length;
		expectUpdateFolderQuery(query, numFields);

		expect(params).toEqual([
			updateData.name, updateData.summary, updateData.visibility, updateData.color, 1, 2
		]);
    });
});


// Helper function for query structure validation
function expectDeleteFolderQuery(query) {
	expect(query).toContain("DELETE FROM user_folders");
	expect(query).toContain("WHERE user_id = $1 AND id = $2;");
}

describe("deleteProjectFolder", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ----------- SUCCESSFUL REMOVAL OF PROJECT FOLDER ------------

	it("Deletes a single project folder", async () => {
		pool.query.mockResolvedValue({
			rowCount: 1
		});

		const result = await deleteProjectFolder(1,1);

		const [query, params] = pool.query.mock.calls[0];

		expectDeleteFolderQuery(query);
		expect(params).toEqual([1, 1]);
		expect(result).toBe(1);
	});

	// ----------- UNSUCCESSFUL REMOVAL OF PROJECT FOLDER WHEN IT ALREADY DOESN'T EXIST ------------

	it("Returns 0 when the project folder doesn't exist", async () => {
		pool.query.mockResolvedValue({
			rowCount: 0
		});

		const result = await deleteProjectFolder(1,1);

		const [query, params] = pool.query.mock.calls[0];

		expectDeleteFolderQuery(query);
		expect(params).toEqual([1, 1]);
		expect(result).toBe(0);
	});

	// ------------- PROPAGATES DATABASE ERROR ---------------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(deleteProjectFolder(1, 1))
        .rejects.
        toThrow("Unexpected DB error");

        // Although not neccesary, when pool.query fails
        // Validating the query structure and the query parameter
        const [query, params] = pool.query.mock.calls[0];

        expectDeleteFolderQuery(query);
        expect(params).toEqual([1,1]);
    });
});


const mockResolvedPapers = [
	{
		folder_id: 2,
		paper_id: "864364",
		added_at: "2026-05-29T14:53:38.816Z",
		user_id: 1
	},
	{
		folder_id: 2,
		paper_id: "838182",
		added_at: "2026-05-29T14:53:38.816Z",
		user_id: 1
	},
	{
		folder_id: 2,
		paper_id: "405200",
		added_at: "2026-05-29T14:53:38.816Z",
		user_id: 1
	},
	{
		folder_id: 2,
		paper_id: "50376",
		added_at: "2026-05-29T14:53:38.816Z",
		user_id: 1
	}
];

// Helper that validates query structure
function expectFetchPapersQuery(query) {
	expect(query).toContain("SELECT *");
	expect(query).toContain("FROM user_folder_papers");
	expect(query).toContain("WHERE user_id = $1 AND folder_id = $2;");
}

describe("fetchPapersFromFolderById", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// --------- SUCCESSFUL RETRIEVAL OF PROJECT FOLDER PAPERS ---------

	it("Fetches an array of papers from a project folder", async () => {
		pool.query.mockResolvedValue({
			rows: mockResolvedPapers,
		});

		const result = await fetchPapersFromFolderById(1, 2);

		const [query, params] = pool.query.mock.calls[0];

		expectFetchPapersQuery(query);
		expect(params).toEqual([1, 2]);
		expect(result).toEqual(mockResolvedPapers);
	});

	// --------- SUCCESSFUL RETRIEVAL OF EMPTY ARRAY WHEN PROJECT FOLDER DOESN'T HAVE ANY PAPERS ---------

	it("Fetches an array of papers from a project folder", async () => {
		pool.query.mockResolvedValue({
			rows: [],
		});

		const result = await fetchPapersFromFolderById(1, 3);

		const [query, params] = pool.query.mock.calls[0];

		expectFetchPapersQuery(query);
		expect(params).toEqual([1, 3]);
		expect(result).toEqual([]);
	});

	// ------------- PROPAGATES DATABASE ERROR ---------------

    it("An unexpected database error occurs", async () => {
        pool.query.mockRejectedValue(new Error("Unexpected DB error"));

        await expect(fetchPapersFromFolderById(1, 2))
        .rejects.
        toThrow("Unexpected DB error");

        // Although not neccesary, when pool.query fails
        // Validating the query structure and the query parameter
        const [query, params] = pool.query.mock.calls[0];

        expectFetchPapersQuery(query);
        expect(params).toEqual([1,2]);
    });
});