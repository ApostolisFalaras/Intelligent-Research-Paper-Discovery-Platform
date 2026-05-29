import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./../../src/repositories/userFolderRepository.js", () => ({
    fetchProjectFoldersById: vi.fn(),
    createProjectFolder: vi.fn(),
    updateProjectFolder: vi.fn(),
    deleteProjectFolder: vi.fn(),
	fetchPapersFromFolderById: vi.fn()
}));


import { getProjectFoldersById,
	     createProjectFolderById, 
		 patchProjectFolderById,
		 deleteProjectFolderById, 
		 getPapersFromFolderById } from "../../src/services/userService.js";
import { fetchProjectFoldersById, 
	     createProjectFolder,
		 updateProjectFolder, 
		 deleteProjectFolder, 
		 fetchPapersFromFolderById } from "../../src/repositories/userFolderRepository.js";

const mockProjectFolders = [
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
        created_at: "2026-05-23 16:20:16.759277+03",
        updated_at: "2026-05-23 16:20:16.759277+03"
    }
];

describe("getProjectFoldersById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL RETRIEVAL OF PROJECT FOLDERS -----------

    it("Returns the project folders by user id", async () => {
        fetchProjectFoldersById.mockResolvedValue(mockProjectFolders);

        const expectedOutput = mockProjectFolders.map((folder) => ({
            id: folder.id,
            userId: folder.user_id,
            name: folder.name,
            summary: folder.summary,
            paperCount: folder.paper_count,
            isPinned: folder.is_pinned,
            color: folder.color,
            visibility: folder.visibility,
            icon: folder.icon,
            createdAt: folder.created_at,
            updatedAt: folder.updated_at
        }));

        const result = await getProjectFoldersById(1);

        expect(fetchProjectFoldersById).toHaveBeenCalledWith(1);
        expect(fetchProjectFoldersById).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedOutput);
    });

    // ---------- SUCCESSFUL RETRIEVAL OF NO PROJECT FOLDERS IF THE USER DOESN'T HAVE ANY -----------
    
    it("Returns no project folders if user doesn't have any", async () => {
        fetchProjectFoldersById.mockResolvedValue([]);

        const result = await getProjectFoldersById(2);

        expect(fetchProjectFoldersById).toHaveBeenCalledWith(2);
        expect(fetchProjectFoldersById).toHaveBeenCalledTimes(1);
        expect(result).toEqual([]);
    });

    // ---------- INVALID / MISSING USER ID ----------

    it("Throws 400 when the user id is invalid/missing", async () => {
        await expect(getProjectFoldersById("1")).rejects.toThrow("Missing/Invalid user_id");

        expect(fetchProjectFoldersById).not.toHaveBeenCalled();
    });

    // ---------- PROPAGATES DB ERROR -----------
    it("Propagates repository error", async () => {
        fetchProjectFoldersById.mockRejectedValue(new Error("Database query failed"));

        await expect(getProjectFoldersById(1)).rejects.toThrow("Database query failed");

        expect(fetchProjectFoldersById).toHaveBeenCalledWith(1);
        expect(fetchProjectFoldersById).toHaveBeenCalledTimes(1);
    });
});


describe("createProjectFolderById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ----------- SUCCESSFUL CREATION OF PROJECT FOLDER ------------
    
    it("Creates new project folder", async () => {
        createProjectFolder.mockResolvedValue(1);

        // Using the previous mock folder as the new folder to created
        const newProjectFolder = {
            name: mockProjectFolders[0].name,
            summary: mockProjectFolders[0].summary,
            visibility: mockProjectFolders[0].visibility,
            color: mockProjectFolders[0].color,
            icon: mockProjectFolders[0].icon,
            isPinned: mockProjectFolders[0].is_pinned
        };

        await createProjectFolderById(1, newProjectFolder);

        expect(createProjectFolder).toHaveBeenCalledWith(1, newProjectFolder);
        expect(createProjectFolder).toHaveBeenCalledTimes(1);
    });

    it("Creates new project folder for default visibility and isPinned values", async () => {
        createProjectFolder.mockResolvedValue(1);

        // Using the previous mock folder as the new folder to created
        const newProjectFolder = {
            name: mockProjectFolders[0].name,
            summary: mockProjectFolders[0].summary,
            color: mockProjectFolders[0].color,
            icon: mockProjectFolders[0].icon,
        };

        await createProjectFolderById(1, newProjectFolder);

        expect(createProjectFolder).toHaveBeenCalledWith(1, {
            ...newProjectFolder,
            visibility: "private",
            isPinned: false 
        });
        expect(createProjectFolder).toHaveBeenCalledTimes(1);
    });


    // -------------- ERROR CASES -------------

    it("Throws 400 because user id is missing/invalid", async () => {
        createProjectFolder.mockResolvedValue(1);

        // Using the previous mock folder as the new folder to created
        const newProjectFolder = {
            name: mockProjectFolders[0].name,
            summary: mockProjectFolders[0].summary,
            visibility: mockProjectFolders[0].visibility,
            color: mockProjectFolders[0].color,
            icon: mockProjectFolders[0].icon,
            isPinned: mockProjectFolders[0].is_pinned
        };

        await expect(createProjectFolderById(null, newProjectFolder))
        .rejects
        .toThrow("Missing/Invalid user_id");

        expect(createProjectFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 because project folder name is missing", async () => {
        createProjectFolder.mockResolvedValue(1);

        // Using the previous mock folder as the new folder to created
        const newProjectFolder = {
            name: null,
            summary: mockProjectFolders[0].summary,
            visibility: mockProjectFolders[0].visibility,
            color: mockProjectFolders[0].color,
            icon: mockProjectFolders[0].icon,
            isPinned: mockProjectFolders[0].is_pinned
        };

        await expect(createProjectFolderById(1, newProjectFolder))
        .rejects
        .toThrow("'name' is required");
        
        expect(createProjectFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 because project folder name is invalid", async () => {
        createProjectFolder.mockResolvedValue(1);

        // Using the previous mock folder as the new folder to created
        const newProjectFolder = {
            name: "    ",
            summary: mockProjectFolders[0].summary,
            visibility: mockProjectFolders[0].visibility,
            color: mockProjectFolders[0].color,
            icon: mockProjectFolders[0].icon,
            isPinned: mockProjectFolders[0].is_pinned
        };

        await expect(createProjectFolderById(1, newProjectFolder))
        .rejects
        .toThrow("'name' is required");
        
        expect(createProjectFolder).not.toHaveBeenCalled();
    });

    it("Throws 500 because project folder couldn't be created", async () => {
        createProjectFolder.mockResolvedValue(0);

        // Using the previous mock folder as the new folder to created
        const newProjectFolder = {
            name: mockProjectFolders[0].name,
            summary: mockProjectFolders[0].summary,
            visibility: mockProjectFolders[0].visibility,
            color: mockProjectFolders[0].color,
            icon: mockProjectFolders[0].icon,
            isPinned: mockProjectFolders[0].is_pinned
        };

        await expect(createProjectFolderById(1, newProjectFolder))
        .rejects
        .toThrow("Project folder was not inserted");
        
        expect(createProjectFolder).toHaveBeenCalledWith(1, newProjectFolder);
        expect(createProjectFolder).toHaveBeenCalledTimes(1);
    });

    // ------------- DATABASE ERROR PROPAGATION -------------

    it("Propagates repository error", async () => {
        createProjectFolder.mockRejectedValue(new Error("Database query failed"));

        // Using the previous mock folder as the new folder to created
        const newProjectFolder = {
            name: mockProjectFolders[0].name,
            summary: mockProjectFolders[0].summary,
            visibility: mockProjectFolders[0].visibility,
            color: mockProjectFolders[0].color,
            icon: mockProjectFolders[0].icon,
            isPinned: mockProjectFolders[0].is_pinned
        };

        await expect(createProjectFolderById(1, newProjectFolder))
        .rejects
        .toThrow("Database query failed");

        expect(createProjectFolder).toHaveBeenCalledWith(1, newProjectFolder);
        expect(createProjectFolder).toHaveBeenCalledTimes(1);
    });
});


// Updating 4 out of 6 metadata fields
const updateData = {
    name: "Cyber Security",
    summary: "This project folder refers to cybersecurity topics including....",
    color: "blue",
    visibility: "shared"
};

describe("patchProjectFolderById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // --------- SUCCESSFUL UPDATE OF PROJECT FOLDER METADATA ---------

    it("Updates project folder metadata", async () => {
        updateProjectFolder.mockResolvedValue(1);

        const result = await patchProjectFolderById(1, 2, updateData);

        expect(updateProjectFolder).toHaveBeenCalledWith(1, 2, updateData);
        expect(updateProjectFolder).toHaveBeenCalledTimes(1);
    });

    // ---------- ERROR CASES ----------

    it("Throws 400 when user id is missing", async () => {
        await expect(patchProjectFolderById(null, 2, updateData))
        .rejects
        .toThrow("Missing/Invalid user_id");

        expect(updateProjectFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when user id is invalid", async () => {
        await expect(patchProjectFolderById("one", 2, updateData))
        .rejects
        .toThrow("Missing/Invalid user_id");

        expect(updateProjectFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when project folder id is missing", async () => {
        await expect(patchProjectFolderById(1, null, updateData))
        .rejects
        .toThrow("Project folder id is required");

        expect(updateProjectFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when project folder id is invalid", async () => {
        await expect(patchProjectFolderById(1, "one", updateData))
        .rejects
        .toThrow("'Folder Id' must be an integer");

        expect(updateProjectFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when 'isPinned' is non-boolean", async () => {
        await expect(patchProjectFolderById(1, 2, {...updateData, isPinned: "yes"}))
        .rejects
        .toThrow("'isPinned' must be either true or false");

        expect(updateProjectFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when 'visibility' is invalid", async () => {
        await expect(patchProjectFolderById(1, 2, {...updateData, visibility: "shared_to_all"}))
        .rejects
        .toThrow("Invalid 'visibility' value");

        expect(updateProjectFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when no modified fields were provided", async () => {
        await expect(patchProjectFolderById(1, 2, {}))
        .rejects
        .toThrow("No modified fields were provided");

        expect(updateProjectFolder).not.toHaveBeenCalled();
    });
    
    it("Throws 404 when the project folder doesn't exist", async () => {
        updateProjectFolder.mockResolvedValue(0);

        await expect(patchProjectFolderById(1, 2, updateData))
        .rejects
        .toThrow("Project folder not found");

        expect(updateProjectFolder).toHaveBeenCalledWith(1, 2, updateData);
        expect(updateProjectFolder).toHaveBeenCalledTimes(1);
    });
    
});


describe("deleteProjectFolderById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ------------ SUCCESSFUL REMOVAL OF PROJECT FOLDER -------------
    
    it("Deletes a single project folder", async () => {
        deleteProjectFolder.mockResolvedValue(1);

        await deleteProjectFolderById(1, 1);

        expect(deleteProjectFolder).toHaveBeenCalledWith(1, 1);
        expect(deleteProjectFolder).toHaveBeenCalledTimes(1);
    });

    // ----------- ERROR CASES -------------

    it("Throws 400 when user id is missing/invalid", async () => {
        await expect(deleteProjectFolderById(null, 1)).rejects.toThrow("Missing/Invalid user_id");

        expect(deleteProjectFolder).not.toHaveBeenCalled(); 
    });

    it("Throws 400 when project folder id is not a number", async () => {
        await expect(deleteProjectFolderById(1, "one")).rejects.toThrow("'Folder Id' must be an integer");

        expect(deleteProjectFolder).not.toHaveBeenCalled(); 
    });

    it("Throws 404 when no project folder was deleted", async () => {
        deleteProjectFolder.mockResolvedValue(0);

        await expect(deleteProjectFolderById(1, 1))
        .rejects
        .toThrow("Project folder not found");

        expect(deleteProjectFolder).toHaveBeenCalledWith(1, 1);
        expect(deleteProjectFolder).toHaveBeenCalledTimes(1);
    });

    // ------------- DATABASE ERROR PROPAGATION -------------

    it("Propagates repository error", async () => {
        deleteProjectFolder.mockRejectedValue(new Error("Database query failed"));

        await expect(deleteProjectFolderById(1, 1))
        .rejects
        .toThrow("Database query failed");

        expect(deleteProjectFolder).toHaveBeenCalledWith(1, 1);
        expect(deleteProjectFolder).toHaveBeenCalledTimes(1);
    });
});