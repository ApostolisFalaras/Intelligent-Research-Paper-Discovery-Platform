import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("./../../src/repositories/userFolderRepository.js", () => ({
    fetchProjectFoldersById: vi.fn(),
	createProjectFolder: vi.fn(),
	deleteProjectFolder: vi.fn()
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
		 deleteProjectFolder } from "../../src/repositories/userFolderRepository.js"; 
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