import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("./../../src/repositories/userFolderRepository.js", () => ({
    fetchProjectFoldersById: vi.fn(),
	createProjectFolder: vi.fn(),
	updateProjectFolder: vi.fn(),
	deleteProjectFolder: vi.fn(),
	fetchPapersFromFolderById: vi.fn()
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

import { fetchProjectFoldersById,
	     createProjectFolder,
		 updateProjectFolder,
		 deleteProjectFolder, 
		 fetchPapersFromFolderById } from "../../src/repositories/userFolderRepository.js"; 
import { authMiddleware } from "../../src/middlewares/authMiddleware.js";
import app from "../../src/app.js";


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


describe("GET /api/users/me/folders", () => {
    beforeEach(() => {
        vi.resetAllMocks();
		mockAuthenticatedUser = {id: 1};
    });

	// ---------- SUCCESSFUL RETRIEVAL OF USER PROJECT FOLDERS ----------

	it("Returns 200 and an array of project folders", async () => {
		fetchProjectFoldersById.mockResolvedValue(mockResolvedProjectFolders);

		const response = await request(app).get("/api/users/me/folders").expect(200);

		const expectedOutput = mockResolvedProjectFolders.map((folder) => ({
			id: folder.id,
			userId: folder.user_id,
			name: folder.name,
			summary: folder.summary,
			paperCount: folder.paper_count,
			isPinned: folder.is_pinned,
			color: folder.color,
			visibility: folder.visibility,
			icon: folder.icon,
			createdAt: folder.created_at.toISOString(),
			updatedAt: folder.updated_at.toISOString()
		}));

		expect(fetchProjectFoldersById).toHaveBeenCalledWith(1);
		expect(fetchProjectFoldersById).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("success");
		expect(response.body.data).toEqual({
			folders: expectedOutput
		});
	});

	// ---------- SUCCESSFUL RETRIEVAL OF EMPTY ARRAY WHEN USER HAS NO PROJECT FOLDERS ---------

	it("Returns 200 and an empty array as user doesn't have any project folders", async () => {
		fetchProjectFoldersById.mockResolvedValue([]);

		const response = await request(app).get("/api/users/me/folders").expect(200);

		expect(fetchProjectFoldersById).toHaveBeenCalledWith(1);
		expect(fetchProjectFoldersById).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("success");
		expect(response.body.data).toEqual({
			folders: []
		});
	});

	// ---------- MISSING USER ID ----------

	it("Returns 400 when user id is missing", async () => {
		mockAuthenticatedUser = {id: null};

		const response = await request(app).get("/api/users/me/folders").expect(400);		

		expect(fetchProjectFoldersById).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Missing/Invalid user_id");
	});

	// ---------- DATABASE ERROR ----------

	it("Returns 500 when there's an unexpected DB error", async () => {
		fetchProjectFoldersById.mockRejectedValue(new Error("Database error occurred"));

		const response = await request(app).get("/api/users/me/folders").expect(500);

		expect(fetchProjectFoldersById).toHaveBeenCalledWith(1);
		expect(fetchProjectFoldersById).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("error");
		expect(response.body.message).toEqual("Database error occurred");		
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

describe("POST /api/users/me/folders", () => {
    beforeEach(() => {
        vi.resetAllMocks();
		mockAuthenticatedUser = {id: 1};
    });

	// ---------- SUCCESSFUL CREATION OF NEW PROJECT FOLDER ----------
	
	it("Returns 201 when a new project folder is successfully created", async () => {
		createProjectFolder.mockResolvedValue(1);

		const response = await request(app)
		.post("/api/users/me/folders")
		.send(newProjectFolder)
		.expect(201);

		expect(createProjectFolder).toHaveBeenCalledWith(1, newProjectFolder);
		expect(createProjectFolder).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("success");
		expect(response.body.message).toBe("Project folder created successfully");
	});

	// ---------- UNSUCCESSFUL CREATION OF NEW PROJECT FOLDER ----------

	it("Returns 500 when the new project folder could not be created", async () => {
		createProjectFolder.mockResolvedValue(0);

		const response = await request(app)
		.post("/api/users/me/folders")
		.send(newProjectFolder)
		.expect(500);

		expect(createProjectFolder).toHaveBeenCalledWith(1, newProjectFolder);
		expect(createProjectFolder).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("error");
		expect(response.body.message).toBe("Project folder was not inserted");
	});

	// ---------- MISSING USER ID ----------

	it("Returns 400 when user id is missing", async () => {
		mockAuthenticatedUser = {id: null};

		const response = await request(app)
		.post("/api/users/me/folders")
		.send(newProjectFolder)
		.expect(400);		

		expect(createProjectFolder).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Missing/Invalid user_id");
	});

	// ---------- MISSING PROJECT NAME ----------

	it("Returns 400 when project name is missing", async () => {
		const response = await request(app)
		.post("/api/users/me/folders")
		.send({ ...newProjectFolder, name: null })
		.expect(400);

		expect(createProjectFolder).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("'name' is required");
	});

	// ---------- DATABASE ERROR ----------

	it("Returns 500 when there's an unexpected DB error", async () => {
		createProjectFolder.mockRejectedValue(new Error("Database error occurred"));

		const response = await request(app)
		.post("/api/users/me/folders")
		.send(newProjectFolder)
		.expect(500);

		expect(createProjectFolder).toHaveBeenCalledWith(1, newProjectFolder);
		expect(createProjectFolder).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("error");
		expect(response.body.message).toEqual("Database error occurred");		
	});
});


// Updating 4 out of 6 metadata fields
const updateData = {
    name: "Cyber Security",
    summary: "This project folder refers to cybersecurity topics including....",
    color: "blue",
    visibility: "shared"
};

describe("PATCH /api/user/me/folders/:id", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockAuthenticatedUser = {id: 1};
	});

	// ---------- SUCCESSFUL PROJECT FOLDER UPDATE ----------

	it("Returns 200 when a project folder is successfully updated", async () => {
		updateProjectFolder.mockResolvedValue(1);

		const response = await request(app)
		.patch("/api/users/me/folders/2")
		.send(updateData)
		.expect(200);

		expect(updateProjectFolder).toHaveBeenCalledWith(1, 2, updateData);
		expect(updateProjectFolder).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("success");
		expect(response.body.message).toBe("Project folder updated successfully");
	});

	// ---------- UNSUCCESSFUL PROJECT FOLDER UPDATE ----------

	it("Returns 404 when a project folder doesn't exist", async () => {
		updateProjectFolder.mockResolvedValue(0);

		const response = await request(app)
		.patch("/api/users/me/folders/2")
		.send(updateData)
		.expect(404);

		expect(updateProjectFolder).toHaveBeenCalledWith(1, 2, updateData);
		expect(updateProjectFolder).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Project folder not found");
	});

	// ---------- MISSING PROJECT FOLDER ID ----------

	it("Returns 400 when project folder id is missing", async () => {

		const response = await request(app)
		.patch("/api/users/me/folders/abc")
		.send(updateData)
		.expect(400);		

		expect(updateProjectFolder).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("'Folder Id' must be an integer");
	});

	it("Returns 400 when project folder id is invalid", async () => {

		const response = await request(app)
		.patch("/api/users/me/folders/0")
		.send(updateData)
		.expect(400);		

		expect(updateProjectFolder).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Project folder id is required");
	});

	// ---------- MISSING USER ID ----------

	it("Returns 400 when user id is missing", async () => {
		mockAuthenticatedUser = {id: null};

		const response = await request(app)
		.patch("/api/users/me/folders/2")
		.send(updateData)
		.expect(400);		

		expect(updateProjectFolder).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Missing/Invalid user_id");
	});

	// ---------- INVALID UPDATE PARAMETERS ---------

	it("Returns 400 when isPinned is not a boolean value", async () => {
		const response = await request(app)
		.patch("/api/users/me/folders/2")
		.send({
			...updateData,
			isPinned: "yes"
		})
		.expect(400);

		expect(updateProjectFolder).not.toHaveBeenCalled();
		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("'isPinned' must be either true or false");
	});

	it("Returns 400 when visibility is invalid", async () => {
		const response = await request(app)
		.patch("/api/users/me/folders/2")
		.send({
			...updateData,
			visibility: "shared_to_all"
		})
		.expect(400);

		expect(updateProjectFolder).not.toHaveBeenCalled();
		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Invalid 'visibility' value");
	});

	it("Returns 400 when visibility is invalid", async () => {
		const response = await request(app)
		.patch("/api/users/me/folders/2")
		.send({})
		.expect(400);

		expect(updateProjectFolder).not.toHaveBeenCalled();
		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("No modified fields were provided");
	});

	// ---------- DATABASE ERROR ----------

	it("Returns 500 when there's an unexpected DB error", async () => {
		updateProjectFolder.mockRejectedValue(new Error("Database error occurred"));

		const response = await request(app)
		.patch("/api/users/me/folders/2")
		.send(updateData)
		.expect(500);

		expect(updateProjectFolder).toHaveBeenCalledWith(1, 2, updateData);
		expect(updateProjectFolder).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("error");
		expect(response.body.message).toEqual("Database error occurred");		
	});
});

describe("DELETE /api/users/me/folders/:id", () => {
    beforeEach(() => {
        vi.resetAllMocks();
		mockAuthenticatedUser = {id: 1};
    });

	// ---------- SUCCESSFUL DELETION OF PROJECT FOLDER ----------

	it("Returns 200 when a project folder is successfully deleted", async () => {
		deleteProjectFolder.mockResolvedValue(1);

		const response = await request(app).delete("/api/users/me/folders/1").expect(200);

		expect(deleteProjectFolder).toHaveBeenCalledWith(1, 1);
		expect(deleteProjectFolder).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("success");
		expect(response.body.message).toBe("Project folder deleted successfully");
	});

	// ---------- UNSUCCESSFUL DELETION WHEN USER FOLDER DOESN'T EXIST ----------

	it("Returns 404 when the project folder already doesn't exist", async () => {
		deleteProjectFolder.mockResolvedValue(0);

		const response = await request(app).delete("/api/users/me/folders/1").expect(404);

		expect(deleteProjectFolder).toHaveBeenCalledWith(1, 1);
		expect(deleteProjectFolder).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Project folder not found");
	});

	// ---------- MISSING PROJECT FOLDER ID ----------

	it("Returns 400 when project folder id is missing", async () => {

		const response = await request(app)
		.delete("/api/users/me/folders/abc")
		.expect(400);		

		expect(deleteProjectFolder).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("'Folder Id' must be an integer");
	});

	it("Returns 400 when project folder id is invalid", async () => {

		const response = await request(app)
		.delete("/api/users/me/folders/0")
		.expect(400);		

		expect(deleteProjectFolder).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Project folder id is required");
	});

	// ---------- MISSING USER ID ----------

	it("Returns 400 when user id is missing", async () => {
		mockAuthenticatedUser = {id: null};

		const response = await request(app)
		.delete("/api/users/me/folders/1")
		.expect(400);		

		expect(deleteProjectFolder).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Missing/Invalid user_id");
	});

	// ---------- DATABASE ERROR ----------

	it("Returns 500 when there's an unexpected DB error", async () => {
		deleteProjectFolder.mockRejectedValue(new Error("Database error occurred"));

		const response = await request(app)
		.delete("/api/users/me/folders/1")
		.expect(500);

		expect(deleteProjectFolder).toHaveBeenCalledWith(1, 1);
		expect(deleteProjectFolder).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("error");
		expect(response.body.message).toEqual("Database error occurred");		
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

describe("GET /api/users/me/folders/:id/papers", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockAuthenticatedUser = {id: 1};
	});

	// --------- SUCCESSFUL RETRIEVAL OF PROJECT FOLDER PAPERS ---------

	it("Returns 200 and fetches all the papers of a project folder", async () => {
		fetchPapersFromFolderById.mockResolvedValue(mockResolvedPapers);

		const expectedOutput = mockResolvedPapers.map((paper) => ({
			paperId: paper.paper_id,
			folderId: paper.folder_id,
			userId: paper.user_id,
			addedAt: paper.added_at
		}));

		const response = await request(app).get("/api/users/me/folders/2/papers").expect(200);

		expect(fetchPapersFromFolderById).toHaveBeenCalledWith(1, 2);
		expect(fetchPapersFromFolderById).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("success");
		expect(response.body.data).toEqual(expectedOutput);
	});


	// --------- SUCCESSFUL RETRIEVAL OF EMPTY ARRAY WHEN THE PROJECT FOLDER IS EMPTY ---------

	it("Returns 200 and an empty array when the project folder is empty", async () => {
		fetchPapersFromFolderById.mockResolvedValue([]);

		const response = await request(app).get("/api/users/me/folders/3/papers").expect(200);

		expect(fetchPapersFromFolderById).toHaveBeenCalledWith(1, 3);
		expect(fetchPapersFromFolderById).toHaveBeenCalledTimes(1);
		
		expect(response.body.status).toBe("success");
		expect(response.body.data).toEqual([]);
	});

	// --------- MISSING/INVALID USER ID ---------

	it("Returns 400 when user id is missing", async () => {
		// Simulating unauthenticated user
		mockAuthenticatedUser = {id: null};

		const response = await request(app).get("/api/users/me/folders/2/papers").expect(400);

		expect(fetchPapersFromFolderById).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Missing/Invalid user_id");
	});

	it("Returns 400 when user id is missing", async () => {
		// Simulating invalid id
		mockAuthenticatedUser = {id: "one"};

		const response = await request(app).get("/api/users/me/folders/2/papers").expect(400);

		expect(fetchPapersFromFolderById).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Missing/Invalid user_id");
	});

	// --------- MISSING/INVALID FOLDER ID ---------

	it("Returns 400 when folder id is missing", async () => {
		const response = await request(app).get("/api/users/me/folders/abc/papers").expect(400);

		expect(fetchPapersFromFolderById).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("'Folder Id' must be an integer");
	});

	it("Returns 400 when folder id is invalid", async () => {
		const response = await request(app).get("/api/users/me/folders/0/papers").expect(400);

		expect(fetchPapersFromFolderById).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("Project folder id is required");
	});

	// ---------- DATABASE ERROR ----------

	it("Returns 500 when there's an unexpected DB error", async () => {
		fetchPapersFromFolderById.mockRejectedValue(new Error("Database error occurred"));

		const response = await request(app).get("/api/users/me/folders/2/papers").expect(500);

		expect(fetchPapersFromFolderById).toHaveBeenCalledWith(1, 2);
		expect(fetchPapersFromFolderById).toHaveBeenCalledTimes(1);

		expect(response.body.status).toBe("error");
		expect(response.body.message).toEqual("Database error occurred");		
	});
});