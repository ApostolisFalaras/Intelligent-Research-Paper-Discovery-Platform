import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./../../src/repositories/userFolderRepository.js", () => ({
    fetchProjectFoldersById: vi.fn(),
    createProjectFolder: vi.fn(),
    updateProjectFolder: vi.fn(),
    deleteProjectFolder: vi.fn(),
	fetchPapersFromFolderById: vi.fn(),
    fetchPaperInFolder: vi.fn(),
    insertPapertoFolder: vi.fn(),
    deletePaperFromFolder: vi.fn()
}));

vi.mock("../../src/repositories/paperRepository.js", () => ({
    fetchPaperById: vi.fn()
}));

import { getProjectFoldersById,
	     createProjectFolderById, 
		 patchProjectFolderById,
		 deleteProjectFolderById, 
		 getPapersFromFolderById,
         addPapertoFolderById, 
         deletePaperFromFolderById} from "../../src/services/userService.js";
import { fetchProjectFoldersById, 
	     createProjectFolder,
		 updateProjectFolder, 
		 deleteProjectFolder, 
		 fetchPapersFromFolderById, 
         insertPapertoFolder,
         fetchPaperInFolder,
         deletePaperFromFolder } from "../../src/repositories/userFolderRepository.js";
import { fetchPaperById } from "../../src/repositories/paperRepository.js";

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

	// ---------- PROPAGATES DB ERROR -----------
    it("Propagates repository error", async () => {
        updateProjectFolder.mockRejectedValue(new Error("Database query failed"));

        await expect(patchProjectFolderById(1, 2, updateData)).rejects.toThrow("Database query failed");

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


describe("getPapersFromFolderById", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL RETRIEVAL OF PROJECT FOLDER PAPERS ----------

	it("Returns the papers belonging in a project folder", async () => {
		fetchPapersFromFolderById.mockResolvedValue(mockResolvedPapers);

		const results = await getPapersFromFolderById(1, 2);

		const expectedOutput = mockResolvedPapers.map((paper) => ({
            id: paper.openalex_id,
            internalId: paper.id,
            title: paper.title,
            displayName: paper.display_name,
            abstract: paper.abstract,
            publicationYear: paper.publication_year,
            citedByCount: paper.cited_by_count,
            fwci: Number(paper.fwci),
            primarySource: paper.primary_source_display_name,
            primaryTopic: paper.primary_topic_display_name,
            isOpenAccess: paper.is_open_access,
            openAccessStatus: paper.open_access_status,
            authorCount: Number(paper.author_count),
            authorsPreview: paper.authors_preview,
            folderId: paper.folder_id,
            addedAt: paper.added_at,
        }));

		expect(fetchPapersFromFolderById).toHaveBeenCalledWith(1, 2);
		expect(fetchPapersFromFolderById).toHaveBeenCalledTimes(1);
		expect(results).toEqual(expectedOutput);
	}); 

	// ---------- SUCCESSFUL RETRIEVAL OF EMPTY ARRAY WHEN PROJECT FOLDER DOESN'T HAVE ANY PAPERS ----------
	
	it("Returns empty array when project folder doesn't have any papers", async () => {
		fetchPapersFromFolderById.mockResolvedValue([]);

		const results = await getPapersFromFolderById(1, 3);

		expect(fetchPapersFromFolderById).toHaveBeenCalledWith(1, 3);
		expect(fetchPapersFromFolderById).toHaveBeenCalledTimes(1);
		expect(results).toEqual([]);
	}); 

	// ---------- MISSING/INVALID IDS ----------

	it("Throws 400 when user id is missing", async () => {
		await expect(getPapersFromFolderById(null, 2)).rejects.toThrow("Missing/Invalid user_id");

		expect(fetchPapersFromFolderById).not.toHaveBeenCalled();
	});

	it("Throws 400 when user id is invalid", async () => {
		await expect(getPapersFromFolderById("one", 2)).rejects.toThrow("Missing/Invalid user_id");

		expect(fetchPapersFromFolderById).not.toHaveBeenCalled();
	});

	// ---------- FOLDER ID ERRORS ----------

	it("Throws 400 when folder id is invalid", async () => {
		await expect(getPapersFromFolderById(1, "one")).rejects.toThrow("'Folder Id' must be an integer");

		expect(fetchPapersFromFolderById).not.toHaveBeenCalled();
	});

	it("Throws 400 when folder id is null", async () => {
		await expect(getPapersFromFolderById(1, null)).rejects.toThrow("Project folder id is required");

		expect(fetchPapersFromFolderById).not.toHaveBeenCalled();
	});

	// ---------- PROPAGATES DB ERROR -----------
    it("Propagates repository error", async () => {
        fetchPapersFromFolderById.mockRejectedValue(new Error("Database query failed"));

        await expect(getPapersFromFolderById(1, 2)).rejects.toThrow("Database query failed");

        expect(fetchPapersFromFolderById).toHaveBeenCalledWith(1, 2);
        expect(fetchPapersFromFolderById).toHaveBeenCalledTimes(1);
    });
});



describe("addPapertoFolderById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL ADDITION OF PAPER TO A PROJECT FOLDER ----------

    it("Adds paper to project folder", async () => {
        // Not mocking all paper fields for simplicity 
        fetchPaperById.mockResolvedValue({
            id: 204129,
            openalex_id: "W7129423223"
        });
        fetchPaperInFolder.mockResolvedValue(null);
        insertPapertoFolder.mockResolvedValue(1);

        await addPapertoFolderById(1, 2, "W7129423223");

        // id: 204129 from fetchPaperById()
        expect(fetchPaperInFolder).toHaveBeenCalledWith(2, 204129);
        expect(fetchPaperInFolder).toHaveBeenCalledTimes(1);

        expect(insertPapertoFolder).toHaveBeenCalledWith(1, 2, 204129);
        expect(insertPapertoFolder).toHaveBeenCalledTimes(1);
    });

    // ----------- ERROR CASES -----------

    it("Throws 400 when user id is missing", async () => {
        await expect(addPapertoFolderById(null, 2, "W7129423223"))
        .rejects
        .toThrow("Missing/Invalid user_id");

        expect(fetchPaperById).not.toHaveBeenCalled();
        expect(insertPapertoFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when user id is invalid", async () => {
        await expect(addPapertoFolderById("one", 2, "W7129423223"))
        .rejects
        .toThrow("Missing/Invalid user_id");

        expect(fetchPaperById).not.toHaveBeenCalled();
        expect(insertPapertoFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when folder id is invalid", async () => {
        await expect(addPapertoFolderById(1, "two", "W7129423223"))
        .rejects
        .toThrow("'Folder Id' must be an integer");

        expect(fetchPaperById).not.toHaveBeenCalled();
        expect(insertPapertoFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when folder id is missing", async () => {
        await expect(addPapertoFolderById(1, null, "W7129423223"))
        .rejects
        .toThrow("Project folder id is required");

        expect(fetchPaperById).not.toHaveBeenCalled();
        expect(insertPapertoFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when paper id is missing", async () => {
        fetchPaperById.mockResolvedValue(null);

        await expect(addPapertoFolderById(1, 2, null))
        .rejects
        .toThrow("Invalid paper id");

        expect(insertPapertoFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when paper id is not a string", async () => {
        fetchPaperById.mockResolvedValue(null);

        await expect(addPapertoFolderById(1, 2, 7129))
        .rejects
        .toThrow("'paper id' must be a string");

        expect(insertPapertoFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when paper id doesn't follow the correct format", async () => {
        fetchPaperById.mockResolvedValue(null);

        await expect(addPapertoFolderById(1, 2, "7129"))
        .rejects
        .toThrow("Invalid paper id");

        expect(insertPapertoFolder).not.toHaveBeenCalled();
    });

    it("Throws 404 when paper doesn't exist", async () => {
        fetchPaperById.mockResolvedValue(null);

        await expect(addPapertoFolderById(1, 2, "W7129"))
        .rejects
        .toThrow("Paper not found");

        expect(insertPapertoFolder).not.toHaveBeenCalled();
    });

    it("Throws 409 when paper already exists in the project folder", async () => {
        // Not mocking all paper fields for simplicity 
        fetchPaperById.mockResolvedValue({
            id: 204129,
            openalex_id: "W7129423223"
        });

        // Paper already exists in the project folder
        fetchPaperInFolder.mockResolvedValue({
            folder_id: 2,
            paper_id: 204129,
            created_at: new Date("2026-05-31 09:40:12.804588+03")
        });

        await expect(addPapertoFolderById(1, 2, "W7129"))
        .rejects
        .toThrow("Paper already exists in project folder");

        expect(insertPapertoFolder).not.toHaveBeenCalled();
    });

    // --------- DB ERRORS ---------

    it("Throws 500 when paper couldn't be added to the project folder", async () => {
        // Not mocking all paper fields for simplicity 
        fetchPaperById.mockResolvedValue({
            id: 204129,
            openalex_id: "W7129423223"
        });
        fetchPaperInFolder.mockResolvedValue(null);
        insertPapertoFolder.mockResolvedValue(0);

        await expect(addPapertoFolderById(1, 2, "W7129423223"))
        .rejects
        .toThrow("Paper was not inserted to project folder");

        // id: 204129 from fetchPaperById()
        expect(fetchPaperInFolder).toHaveBeenCalledWith(2, 204129);
        expect(fetchPaperInFolder).toHaveBeenCalledTimes(1);

        expect(insertPapertoFolder).toHaveBeenCalledWith(1, 2, 204129);
        expect(insertPapertoFolder).toHaveBeenCalledTimes(1);
    });

    it("Propagates repository error", async () => {
        // Not mocking all paper fields for simplicity 
        fetchPaperById.mockResolvedValue({
            id: 204129,
            openalex_id: "W7129423223"
        });
        fetchPaperInFolder.mockResolvedValue(null);
        insertPapertoFolder.mockRejectedValue(new Error("Database query failed"));

        await expect(addPapertoFolderById(1, 2, "W7129423223"))
        .rejects
        .toThrow("Database query failed");

        // id: 204129 from fetchPaperById()
        expect(fetchPaperInFolder).toHaveBeenCalledWith(2, 204129);
        expect(fetchPaperInFolder).toHaveBeenCalledTimes(1);

        expect(insertPapertoFolder).toHaveBeenCalledWith(1, 2, 204129);
        expect(insertPapertoFolder).toHaveBeenCalledTimes(1);
    });
});


describe("deletePaperFromFolderById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ----------- SUCCESSFUL DELETION OF PAPER FROM PROJECT FOLDER -----------
    
    it("Deletes a paper from a project folder", async () => {
        // Not mocking all paper fields for simplicity
        fetchPaperById.mockResolvedValue({
            id: 204129,
            openalex_id: "W7129423223"
        });

        deletePaperFromFolder.mockResolvedValue(1);

        await deletePaperFromFolderById(1, 2, "W7129423223");

        expect(deletePaperFromFolder).toHaveBeenCalledWith(1, 2, 204129);
        expect(deletePaperFromFolder).toHaveBeenCalledTimes(1);
    });

    // ----------- UNSUCCESSFUL DELETION OF PAPER FROM PROJECT FOLDER -----------
    
    it("Throws 404 when it fails to delete a paper from a project folder", async () => {
        // Not mocking all paper fields for simplicity
        fetchPaperById.mockResolvedValue({
            id: 204129,
            openalex_id: "W7129423223"
        });

        deletePaperFromFolder.mockResolvedValue(0);

        await expect(deletePaperFromFolderById(1, 2, "W7129423223"))
        .rejects
        .toThrow("Paper wasn't stored in project folder");

        expect(deletePaperFromFolder).toHaveBeenCalledWith(1, 2, 204129);
        expect(deletePaperFromFolder).toHaveBeenCalledTimes(1);
    });

    // ----------- ERROR CASES -----------

    it("Throws 400 when user id is missing", async () => {
        await expect(deletePaperFromFolderById(null, 2, "W7129423223"))
        .rejects
        .toThrow("Missing/Invalid user_id");

        expect(deletePaperFromFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when user id is invalid", async () => {
        await expect(deletePaperFromFolderById("one", 2, "W7129423223"))
        .rejects
        .toThrow("Missing/Invalid user_id");

        expect(deletePaperFromFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when folder id is invalid", async () => {
        await expect(deletePaperFromFolderById(1, "two", "W7129423223"))
        .rejects
        .toThrow("'Folder Id' must be an integer");

        expect(deletePaperFromFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when folder id is missing", async () => {
        await expect(deletePaperFromFolderById(1, null, "W7129423223"))
        .rejects
        .toThrow("Project folder id is required");

        expect(deletePaperFromFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when paper id is missing", async () => {
        await expect(deletePaperFromFolderById(1, 2, null))
        .rejects
        .toThrow("Invalid paper id");

        expect(deletePaperFromFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when paper id is not a string", async () => {
        await expect(deletePaperFromFolderById(1, 2, 7129))
        .rejects
        .toThrow("'paper id' must be a string");

        expect(deletePaperFromFolder).not.toHaveBeenCalled();
    });

    it("Throws 400 when paper id doesn't follow the correct format", async () => {
        await expect(deletePaperFromFolderById(1, 2, "7129"))
        .rejects
        .toThrow("Invalid paper id");

        expect(deletePaperFromFolder).not.toHaveBeenCalled();
    });

    // --------- DB ERROR ---------
    it("Propagates repository error", async () => {
        // Not mocking all paper fields for simplicity 
        fetchPaperById.mockResolvedValue({
            id: 204129,
            openalex_id: "W7129423223"
        });
        
        deletePaperFromFolder.mockRejectedValue(new Error("Database query failed"))

        await expect(deletePaperFromFolderById(1, 2, "W7129423223"))
        .rejects
        .toThrow("Database query failed");

        expect(deletePaperFromFolder).toHaveBeenCalledWith(1, 2, 204129);
        expect(deletePaperFromFolder).toHaveBeenCalledTimes(1);
    });
});