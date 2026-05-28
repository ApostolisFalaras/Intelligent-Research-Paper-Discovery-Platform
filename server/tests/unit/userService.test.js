import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./../../src/repositories/userRepository.js", () => ({
    fetchUserById: vi.fn(),
}));

vi.mock("./../../src/repositories/userHistoryRepository.js", () => ({
    fetchUserSearchHistory: vi.fn(),
    addToSearchHistory: vi.fn(),
    deleteFromSearchHistory: vi.fn()
}));

vi.mock("./../../src/repositories/userFolderRepository.js", () => ({
    fetchProjectFoldersById: vi.fn(),
    createProjectFolder: vi.fn(),
    updateProjectFolder: vi.fn(),
    deleteProjectFolder: vi.fn()
}));

import { fetchUserById } from "./../../src/repositories/userRepository.js";
import { createProjectFolderById, deleteProjectFolderById, deleteUserSearchHistoryById, getProjectFoldersById, getUserMe, getUserSearchHistory, patchProjectFolderById } from "./../../src/services/userService.js";
import { addToSearchHistory, deleteFromSearchHistory, fetchUserSearchHistory } from "../../src/repositories/userHistoryRepository.js";
import { fetchProjectFoldersById, createProjectFolder, deleteProjectFolder, updateProjectFolder } from "../../src/repositories/userFolderRepository.js";

const mockResolvedUser = {
    id: 1,
    username: "ApostolisCoder",
    email: "apostolisCoder@email.com",
    first_name: "Apostolis",
    last_name: "Falaras",
    affiliation: "None",
    role: "Full-Stack Software Engineer",
    bio: "Junior Full-Stack Engineer currently studying Node.js and React",
    avatar_url: "None",
    created_at: "2026-05-09 16:58:35.442164+03",
    updated_at: "2026-05-09 16:58:35.442164+03"
};


describe("getUserMe", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ------------- SUCCESSFUL RETRIEVAL OF USER ---------------

    it("Returns the current user record and maps it to a formatted DTO", async () => {
        fetchUserById.mockResolvedValue(mockResolvedUser);

        const expectedOutput = {
            id: mockResolvedUser.id,
            username: mockResolvedUser.username,
            email: mockResolvedUser.email,
            firstName: mockResolvedUser.first_name,
            lastName: mockResolvedUser.last_name,
            affiliation: mockResolvedUser.affiliation,
            role: mockResolvedUser.role,
            bio: mockResolvedUser.bio,
            createdAt: mockResolvedUser.created_at,
            updatedAt: mockResolvedUser.updated_at 
        };

        // Assuming req.user.id = 1
        const result = await getUserMe(1);

        expect(fetchUserById).toHaveBeenCalledWith(1);
        expect(fetchUserById).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedOutput);
    });

    // ------------- ID MISSING -> 400 BAD REQUEST ---------------    

    it("Throws 400 when the user id is missing", async () => {
        await expect(getUserMe()).rejects.toThrow("Missing/Invalid user_id");

        expect(fetchUserById).not.toHaveBeenCalled();
    });

    // ------------- ID NOT A NUMBER -> 400 BAD REQUEST ---------------    

    it("Throws 400 when the user id is not a number", async () => {
        await expect(getUserMe("1")).rejects.toThrow("Missing/Invalid user_id");

        expect(fetchUserById).not.toHaveBeenCalled();
    });

    // ------------- USER DOESN'T EXIST -> 404 NOT FOUND --------------- 

    it("Throws 404 when the user doesn't exist in the DB", async () => {
        fetchUserById.mockResolvedValue(null);

        await expect(getUserMe(10000)).rejects.toThrow("User profile not found");

        expect(fetchUserById).toHaveBeenCalledWith(10000);
        expect(fetchUserById).toHaveBeenCalledTimes(1);
    });

    // ------------- PROPAGATES REPOSITORY ERROR --------------- 

    it("Propagates repository error", async () => {
        fetchUserById.mockRejectedValue(new Error("Database query failed"));

        await expect(getUserMe(1)).rejects.toThrow("Database query failed");

        expect(fetchUserById).toHaveBeenCalledWith(1);
        expect(fetchUserById).toHaveBeenCalledTimes(1);
    });

});


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
    
    it("Throws 403 when the project folder doesn't exist", async () => {
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