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
		 fetchPapersFromFolderById,
		 fetchPaperInFolder,
		 insertPapertoFolder,
		 deletePaperFromFolder } from "./../../src/repositories/userFolderRepository.js";


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
        id: "50376",
		openalex_id: "W2010608861",
        title: "Suggesting accurate method and class names",
        display_name: "Suggesting accurate method and class names",
        abstract: "Descriptive names are a vital part of readable, and hence maintainable, code. Recent progress on ....",
        publication_year: 2015,
        cited_by_count: 386,
        fwci: 79.0533,
        primary_source_display_name: null,
        primary_topic_display_name: "Software Engineering Research",
        is_open_access: true,
        open_access_status: "green",
        author_count: 4,
        authors_preview: [
            { id: "A5080221214", name: "Miltiadis Allamanis" },
            { id: "A5076587279", name: "Earl T. Barr" }
        ],
        folder_id: 2,
        added_at: new Date("2026-05-29T14:53:38.816Z")
	},
	{
        id: "405200",
		openalex_id: "W2163851162",
        title: "Preliminary guidelines for empirical research in software engineering",
        display_name: "Preliminary guidelines for empirical research in software engineering",
        abstract: "Empirical software engineering research needs research guidelines to improve the research and reporting processes. We propose a preliminary set of research guidelines aimed at stimulating discussion among software researchers. They are based on a review of research guidelines developed for medical researchers and on our own experience in doing and reviewing software engineering research. The guidelines are intended to assist researchers, reviewers, and meta-analysts in designing, conducting, and evaluating empirical studies. Editorial boards of software engineering journals may wish to use our recommendations as a basis for developing guidelines for reviewers and for framing policies for dealing with the design, data collection, and analysis and reporting of empirical studies.",
        publication_year: 2002,
        cited_by_count: 1493,
        fwci: 86.9251,
        primary_source_display_name: "IEEE Transactions on Software Engineering",
        primary_topic_display_name: "Software Engineering Research",
        is_open_access: true,
        open_access_status: "green",
        author_count: 6,
        authors_preview: [
            { id: "A5012102325", name: "Barbara Kitchenham" },
            { id: "A5109245255", name: "Shari Lawrence Pfleeger" }
        ],
        folder_id: 2,
        added_at: new Date("2026-05-29T14:53:38.816Z")
	},
];


// Helper that validates query structure
function expectFetchPapersQuery(query) {
	expect(query).toContain("SELECT");
	expect(query).toContain("FROM user_folder_papers ufp");
	expect(query).toContain("JOIN user_folders uf ON uf.id = ufp.folder_id");
	expect(query).toContain("JOIN papers p ON p.id = ufp.paper_id");
	expect(query).toContain("LEFT JOIN paper_authors pa ON pa.paper_id = p.id");
	expect(query).toContain("WHERE uf.user_id = $1 AND uf.id = $2");
	expect(query).toContain("GROUP BY p.id, ufp.folder_id, ufp.added_at");
	expect(query).toContain("ORDER BY ufp.added_at DESC;");
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


const mockResolvedPaperInFolder = {
	folder_id: 2,
	paper_id: 204129,
	created_at: new Date("2026-05-31 09:40:12.804588+03")
};

// Helper function that validates query structure
function expectFetchPaperInFolderQuery(query) {
	expect(query).toContain("SELECT *");
	expect(query).toContain("FROM user_folder_papers");
	expect(query).toContain("WHERE folder_id = $1 AND paper_id = $2;");
}

describe("fetchPaperInFolder", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// --------- FETCHES PAPER ENTRY FROM PROJECT FOLDER DURING DUPLICATE VALIDATION ---------

	it("Fetches a paper entry from a project folder", async () => {
		pool.query.mockResolvedValue({
			rows: [
				mockResolvedPaperInFolder
			]
		});

		const result = await fetchPaperInFolder(2, 204129);

		const [query, params] = pool.query.mock.calls[0];

		expectFetchPaperInFolderQuery(query);
		expect(params).toEqual([2, 204129]);
		expect(result).toEqual(mockResolvedPaperInFolder);
	});

	// --------- FETCHES NULL WHEN NO DUPLICATE ENTRY EXISTS IN THE PROJECT FOLDER ---------

	it("Fetches null when the paper entry doesn't exist in the project folder", async () => {
		pool.query.mockResolvedValue({
			rows: []
		});

		const result = await fetchPaperInFolder(2, 204129);

		const [query, params] = pool.query.mock.calls[0];

		expectFetchPaperInFolderQuery(query);
		expect(params).toEqual([2, 204129]);

		expect(result).toBeNull();
	});

	// --------- DB ERROR ---------
	it("An unexpected database error occurred", async () => {
		pool.query.mockRejectedValue(new Error("Unexpected DB error"));

		await expect(fetchPaperInFolder(2, 204129)).rejects.toThrow("Unexpected DB error");

		const [query, params] = pool.query.mock.calls[0];

		expectFetchPaperInFolderQuery(query);
		expect(params).toEqual([2, 204129]);
	});
});


// Helper function that validates query structure
function expectInsertPapertoFolderQuery(query) {
	expect(query).toContain("INSERT INTO user_folder_papers (folder_id, paper_id)");
	expect(query).toContain("SELECT uf.id, $3");
	expect(query).toContain("FROM user_folders uf");
	expect(query).toContain("WHERE uf.user_id = $1 AND uf.id = $2;");
}

describe("insertPaperToFolder", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// --------- INSERTS PAPER TO PROJECT FOLDER ---------

	it("Inserts paper to project folder", async () => {
		pool.query.mockResolvedValue({
			rowCount: 1
		});

		const result = await insertPapertoFolder(1, 2, 204129);

		const [query, params] = pool.query.mock.calls[0];
		expectInsertPapertoFolderQuery(query);
		expect(params).toEqual([1, 2, 204129]);

		expect(result).toBe(1);
	});

	// --------- FAILS TO INSERT PAPER TO PROJECT FOLDER ---------
	
	it("Fails to insert paper to project folder", async () => {
		pool.query.mockResolvedValue({
			rowCount: 0
		});

		const result = await insertPapertoFolder(1, 2, 204129);

		const [query, params] = pool.query.mock.calls[0];
		expectInsertPapertoFolderQuery(query);
		expect(params).toEqual([1, 2, 204129]);

		expect(result).toBe(0);
	});

	// --------- DB ERROR ---------
	it("An unexpected database error occurred", async () => {
		pool.query.mockRejectedValue(new Error("Unexpected DB error"));

		await expect(insertPapertoFolder(1, 2, 204129)).rejects.toThrow("Unexpected DB error");

		const [query, params] = pool.query.mock.calls[0];

		expectInsertPapertoFolderQuery(query);
		expect(params).toEqual([1, 2, 204129]);
	});
});


// Helper function that validates query structure
function expectDeletePaperFromFolderQuery(query) {
	expect(query).toContain("DELETE FROM user_folder_papers");
	expect(query).toContain("USING user_folders uf");
	expect(query).toContain("WHERE ufp.folder_id = uf.id");
	expect(query).toContain("AND uf.user_id = $1");
	expect(query).toContain("AND ufp.folder_id = $2");
	expect(query).toContain("AND ufp.paper_id = $3;");
}

describe("deletePaperFromFolder", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// --------- DELETES PAPER FROM PROJECT FOLDER ---------

	it("Deletes paper from project folder", async () => {
		pool.query.mockResolvedValue({
			rowCount: 1
		});

		const result = await deletePaperFromFolder(1, 2, 204129);

		const [query, params] = pool.query.mock.calls[0];

		expectDeletePaperFromFolderQuery(query);
		expect(params).toEqual([1, 2, 204129]);
	});

	// --------- FAILS TO DELETE PAPER FROM PROJECT FOLDER ---------

	it("Fails to delete paper from project folder", async () => {
		pool.query.mockResolvedValue({
			rowCount: 0
		});

		const result = await deletePaperFromFolder(1, 2, 204129);

		const [query, params] = pool.query.mock.calls[0];

		expectDeletePaperFromFolderQuery(query);
		expect(params).toEqual([1, 2, 204129]);
	});

	// --------- DB ERROR ---------
	it("An unexpected database error occurred", async () => {
		pool.query.mockRejectedValue(new Error("Unexpected DB error"));

		await expect(deletePaperFromFolder(1, 2, 204129)).rejects.toThrow("Unexpected DB error");

		const [query, params] = pool.query.mock.calls[0];

		expectDeletePaperFromFolderQuery(query);
		expect(params).toEqual([1, 2, 204129]);
	});
});