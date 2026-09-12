import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/repositories/userRepository.js", () => ({
    fetchUserById: vi.fn(),
    updateUserById: vi.fn(),
    deleteUserById: vi.fn(),
    upsertUserLoginTime: vi.fn()
}));

vi.mock("../../../src/repositories/profileRepository.js", () => ({
    fetchUserTotalViewedPapers: vi.fn(),
    fetchUserRecentlyViewedPapers: vi.fn(),
    fetchUserTotalSavedPapers: vi.fn(),
    fetchUserRecentlySavedPapers: vi.fn(),
    fetchUserTotalFolders: vi.fn(),
    fetchUserFoldersPreview: vi.fn(),
    fetchUserFollowedAuthors: vi.fn(),
    fetchUserTopResearchTopics: vi.fn()
}));


vi.mock("bcryptjs", () => ({
    default: {
        hash: vi.fn()
    }
}));


import {
    fetchUserById,
    updateUserById,
    deleteUserById,
    upsertUserLoginTime
} from "../../../src/repositories/userRepository.js";

import {
    fetchUserTotalViewedPapers,
    fetchUserRecentlyViewedPapers,
    fetchUserTotalSavedPapers,
    fetchUserRecentlySavedPapers,
    fetchUserTotalFolders,
    fetchUserFoldersPreview,
    fetchUserFollowedAuthors,
    fetchUserTopResearchTopics
} from "../../../src/repositories/profileRepository.js";

import {
    getUserMe,
    updateUserLoginTime,
    getMyProfile,
    patchMyProfile,
    deleteMyProfile
} from "../../../src/services/userService.js";

import bcryptjs from "bcryptjs";


const mockResolvedUser = {
    id: 1,
    username: "ApostolisCoder",
    email: "apostolisCoder@email.com",
    first_name: "Apostolis",
    last_name: "Falaras",
    affiliation: "None",
    location: "Greece",
    role: "Full-Stack Software Engineer",
    bio: "Junior Full-Stack Engineer currently studying Node.js and React",
    avatar_url: "None",
    created_at: "2026-05-09 16:58:35.442164+03",
    updated_at: "2026-05-09 16:58:35.442164+03",
    last_login_at: "2026-05-09 16:58:35.442164+03"
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
            location: mockResolvedUser.location,
            role: mockResolvedUser.role,
            bio: mockResolvedUser.bio,
            avatarURL: "None",
            createdAt: mockResolvedUser.created_at,
            updatedAt: mockResolvedUser.updated_at,
            createdAt: new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }).format(new Date(mockResolvedUser.created_at)),

            updatedAt: mockResolvedUser.updated_at,

            lastLoginAt: new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }).format(new Date(mockResolvedUser.last_login_at))
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


describe("patchMyProfile", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL CASES ----------
    
    it("Updates the provided profile fields", async () => {
        const updates = {
            firstName: "Apostolis",
            lastName: "Falaras",
            affiliation: "University of Thessaly",
            location: "Greece",
            role: "Software Engineer",
            bio: "Backend and systems developer"
        };

        updateUserById.mockResolvedValue(1);

        await patchMyProfile(42, updates);

        expect(updateUserById).toHaveBeenCalledWith(42, updates);
        expect(updateUserById).toHaveBeenCalledTimes(1);

        expect(bcryptjs.hash).not.toHaveBeenCalled();
    });


    it("Hashes a new password before updating the user", async () => {
        const updates = {
            username: "apostolis",
            password: "newPassword123"
        };

        bcryptjs.hash.mockResolvedValue("hashed-password");
        updateUserById.mockResolvedValue(1);

        await patchMyProfile(42, updates);

        expect(bcryptjs.hash).toHaveBeenCalledWith("newPassword123", 12);

        expect(updateUserById).toHaveBeenCalledWith(42, {
            username: "apostolis",
            passwordHash: "hashed-password"
        });
    });

    // ---------- ERROR CASES ----------

    it("Throws 400 when no modified fields are provided", async () => {
        await expect(patchMyProfile(42, {}))
            .rejects
            .toThrow("No modified fields were provided");

        expect(updateUserById).not.toHaveBeenCalled();
    });

    it("Throws 400 when no supported fields are provided", async () => {
        await expect(patchMyProfile(42, { invalidField: "value"}))
            .rejects
            .toThrow("No valid modified fields were provided");

        expect(updateUserById).not.toHaveBeenCalled();
    });

    it("Throws 404 when the user does not exist", async () => {
        updateUserById.mockResolvedValue(0);

        await expect(patchMyProfile(42, { firstName: "Apostolis" }))
            .rejects
            .toThrow("User not found");

        expect(updateUserById).toHaveBeenCalledWith(42, {
            firstName: "Apostolis"
        });
    });

    it("Propagates repository errors", async () => {
        updateUserById.mockRejectedValue(
            new Error("Unexpected DB error")
        );

        await expect(patchMyProfile(42, { firstName: "Apostolis" }))
            .rejects
            .toThrow("Unexpected DB error");
    });
});


describe("deleteMyProfile", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL CASES ----------

    it("Deletes the current user", async () => {
        deleteUserById.mockResolvedValue(1);

        await deleteMyProfile(42);

        expect(deleteUserById).toHaveBeenCalledWith(42);
        expect(deleteUserById).toHaveBeenCalledTimes(1);
    });

    // ---------- ERROR CASES ----------

    it("Throws 404 when the user does not exist", async () => {
        deleteUserById.mockResolvedValue(0);

        await expect(
            deleteMyProfile(42)
        ).rejects.toThrow("User not found");

        expect(deleteUserById).toHaveBeenCalledWith(42);
    });

    it("Propagates repository errors", async () => {
        deleteUserById.mockRejectedValue(
            new Error("Unexpected DB error")
        );

        await expect(
            deleteMyProfile(42)
        ).rejects.toThrow("Unexpected DB error");
    });
});


describe("updateUserLoginTime", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL CASES ----------

    it("Updates the user's last login time", async () => {
        upsertUserLoginTime.mockResolvedValue(1);

        await updateUserLoginTime(42);

        expect(upsertUserLoginTime).toHaveBeenCalledWith(42);
        expect(upsertUserLoginTime).toHaveBeenCalledTimes(1);
    });

    // ---------- ERROR CASES ----------

    it("Throws 400 when the user id is invalid", async () => {
        await expect(updateUserLoginTime("42")).rejects.toThrow("Missing/Invalid user_id");

        expect(upsertUserLoginTime).not.toHaveBeenCalled();
    });

    it("Throws 500 when the user's login time was not updated", async () => {
        upsertUserLoginTime.mockResolvedValue(0);

        await expect(updateUserLoginTime(42)).rejects.toThrow("User login time was not updated.");

        expect(upsertUserLoginTime).toHaveBeenCalledWith(42);
        expect(upsertUserLoginTime).toHaveBeenCalledTimes(1);
    });

    it("Propagates repository error", async () => {
        upsertUserLoginTime.mockRejectedValue(new Error("Database query failed"));

        await expect(updateUserLoginTime(42)).rejects.toThrow("Database query failed");

        expect(upsertUserLoginTime).toHaveBeenCalledWith(42);
        expect(upsertUserLoginTime).toHaveBeenCalledTimes(1);
    });
});


const userProfile = {
    total_viewed_papers: "288",
    preview_viewed_papers: [
        {
            openalex_id: "W3131053508",
            id: "831991",
            title: "Machine Learning Foundations",
            primary_topic_display_name: "Advanced Statistical Modeling Techniques",
            author_count: "1",
            authors_preview: [
                { id: "A5049496911", name: "Taeho Jo" }
            ]
        },
        {
            openalex_id: "W4414630450",
            id: "664827",
            title: "Physics Driven Image Simulation from Commercial Satellite Imagery",
            primary_topic_display_name: "Distributed and Parallel Computing Systems",
            author_count: "6",
            authors_preview: [
                { id: "A5021824018", name: "Scott Sorensen" },
                { id: "A5055427426", name: "Wayne Treible" }
            ]
        },
        {
            openalex_id: "W2093815829",
            id: "407633",
            title: "XtremWeb: Building an Experimental Platform for Global Computing",
            primary_topic_display_name: "Parallel Computing and Optimization Techniques",
            author_count: "4",
            authors_preview: [
                { id: "A5036547514", name: "Cécile Germain" },
                { id: "A5019222358", name: "Vincent Néri" }
            ]
        },
        {
            openalex_id: "W2167109125",
            id: "832856",
            title: "Early power exploration---a World Wide Web application",
            primary_topic_display_name: "Parallel Computing and Optimization Techniques",
            author_count: "2",
            authors_preview: [
                { id: "A5109342511", name: "D.B. Lidsky" },
                { id: "A5088933304", name: "Jan M. Rabaey" }
            ]
        }
    ],
    total_saved_papers: "10",
    preview_saved_papers: [
        {
            openalex_id: "W4238334784",
            id: "540714",
            title: "Inductance 101: modeling and extraction",
            primary_topic_display_name: "Sensor Technology and Measurement Systems",
            author_count: "2",
            authors_preview: [
                { id: "A5088389671", name: "M.W. Beattie" },
                { id: "A5031274783", name: "L.T. Pileggi" }
            ]
        },
        {
            openalex_id: "W1792598830",
            id: "543206",
            title: "Ignition System Integrated AC Ion Current Sensing for Robust and Reliable Online Engine Control",
            primary_topic_display_name: "Sensor Technology and Measurement Systems",
            author_count: "6",
            authors_preview: [
                { id: "A5088973431", name: "H. Wilstermann" },
                { id: "A5057324886", name: "Andthomas D. Greiner" }
            ]
        },
        {
            openalex_id: "W1986328299",
            id: "94747",
            title: "Low-storage Runge-Kutta schemes",
            primary_topic_display_name: "Advanced Data Storage Technologies",
            author_count: "1",
            authors_preview: [
                { id: "A5060027329", name: "John Williamson" }
            ]
        },
        {
            openalex_id: "W2157840548",
            id: "388028",
            title: "Physics at the CLIC e+e- Linear Collider -- Input to the Snowmass process 2013",
            primary_topic_display_name: "Distributed and Parallel Computing Systems",
            author_count: "88",
            authors_preview: [
                { id: "A5065829244", name: "H. Abramowicz" },
                { id: "A5056881719", name: "A. C. Abusleme Hoffman" }
            ]
        }
    ],
    total_user_folders: "1",
    preview_folders: [
        { id: 179, name: "Computer Networks and Communications Reading List", paper_count: 10, color: "orange" }
    ],
    authors_followed: [],
    research_topics: [
        { id: "T10715", name: "Distributed and Parallel Computing Systems", score: 0.196244 },
        { id: "T10054", name: "Parallel Computing and Optimization Techniques", score: 0.134728 },
        { id: "T11986", name: "Scientific Computing and Data Management", score: 0.119989 },
        { id: "T11181", name: "Advanced Data Storage Technologies", score: 0.092942 },
        { id: "T11937", name: "Research Data Management Practices", score: 0.039199 },
        { id: "T12564", name: "Sensor Technology and Measurement Systems", score: 0.035938 },
        { id: "T12859", name: "Cell Image Analysis Techniques", score: 0.029329 },
        { id: "T12692", name: "Magnetic Field Sensors Techniques", score: 0.027425 }
    ]
}


describe("getMyProfile", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL CASE ----------

    it("Returns the user's profile summary and maps it to the expected DTO", async () => {
        fetchUserTotalViewedPapers.mockResolvedValue({
            total_viewed_papers: userProfile.total_viewed_papers
        });
        fetchUserRecentlyViewedPapers.mockResolvedValue(userProfile.preview_viewed_papers);
        fetchUserTotalSavedPapers.mockResolvedValue({
            total_saved_papers: userProfile.total_saved_papers
        });
        fetchUserRecentlySavedPapers.mockResolvedValue(userProfile.preview_saved_papers);
        fetchUserTotalFolders.mockResolvedValue({
            total_user_folders: userProfile.total_user_folders
        });
        fetchUserFoldersPreview.mockResolvedValue(userProfile.preview_folders);
        fetchUserFollowedAuthors.mockResolvedValue(userProfile.authors_followed);
        fetchUserTopResearchTopics.mockResolvedValue(userProfile.research_topics);

        

fetchUserTotalSavedPapers.mockResolvedValue({
    total_saved_papers: userProfile.total_saved_papers
});

fetchUserTotalFolders.mockResolvedValue({
    total_user_folders: userProfile.total_user_folders
});
        const result = await getMyProfile(42);

        expect(fetchUserTotalViewedPapers).toHaveBeenCalledWith(42);
        expect(fetchUserRecentlyViewedPapers).toHaveBeenCalledWith(42);
        expect(fetchUserTotalSavedPapers).toHaveBeenCalledWith(42);
        expect(fetchUserRecentlySavedPapers).toHaveBeenCalledWith(42);
        expect(fetchUserTotalFolders).toHaveBeenCalledWith(42);
        expect(fetchUserFoldersPreview).toHaveBeenCalledWith(42);
        expect(fetchUserFollowedAuthors).toHaveBeenCalledWith(42);
        expect(fetchUserTopResearchTopics).toHaveBeenCalledWith(42);

        expect(result).toEqual({
            totalViewedPapers: Number(userProfile.total_viewed_papers),
            previewViewedPapers: userProfile.preview_viewed_papers.map((paper) => ({
                id: paper.openalex_id,
                internalId: paper.paper_id,
                title: paper.title,
                primaryTopic: paper.primary_topic_display_name,
                authorCount: Number(paper.author_count),
                authorsPreview: paper.authors_preview.map((author) => ({
                    id: author.id,
                    name: author.name
                }))
            })), 
      
            totalSavedPapers: Number(userProfile.total_saved_papers),
            previewSavedPapers: userProfile.preview_saved_papers.map((paper) => ({
                id: paper.openalex_id,
                internalId: paper.paper_id,
                title: paper.title,
                primaryTopic: paper.primary_topic_display_name,
                authorCount: Number(paper.author_count),
                authorsPreview: paper.authors_preview.map((author) => ({
                    id: author.id,
                    name: author.name
                }))
            })),
        
            totalFolders: Number(userProfile.total_user_folders),
            previewFolders: userProfile.preview_folders.map((folder) => ({
                id: folder.id,
                name: folder.name,
                paperCount: folder.paper_count,
                color: folder.color
            })),

            authorsFollowed: userProfile.authors_followed,
            researchTopics: userProfile.research_topics.map((topic) => ({
                id: topic.id,
                name: topic.name,
                score: topic.score
            }))
        });
    });

    it("Returns zero totals and empty arrays when the user has no profile activity", async () => {
        fetchUserTotalViewedPapers.mockResolvedValue({ total_viewed_papers: "0" });
        fetchUserRecentlyViewedPapers.mockResolvedValue([]);
        fetchUserTotalSavedPapers.mockResolvedValue({ total_saved_papers: "0" });
        fetchUserRecentlySavedPapers.mockResolvedValue([]);
        fetchUserTotalFolders.mockResolvedValue({ total_user_folders: "0" });
        fetchUserFoldersPreview.mockResolvedValue([]);
        fetchUserFollowedAuthors.mockResolvedValue([]);
        fetchUserTopResearchTopics.mockResolvedValue([]);

        const result = await getMyProfile(42);

        expect(result).toEqual({
            totalViewedPapers: 0,
            previewViewedPapers: [],
            totalSavedPapers: 0,
            previewSavedPapers: [],
            totalFolders: 0,
            previewFolders: [],
            authorsFollowed: [],
            researchTopics: []
        });
    });

    // ---------- ERROR CASES ----------

    it("Throws 400 when the user id is invalid", async () => {
        await expect(getMyProfile("42")).rejects.toThrow("Missing/Invalid user_id");

        expect(fetchUserTotalViewedPapers).not.toHaveBeenCalled();
        expect(fetchUserRecentlyViewedPapers).not.toHaveBeenCalled();
        expect(fetchUserTotalSavedPapers).not.toHaveBeenCalled();
        expect(fetchUserRecentlySavedPapers).not.toHaveBeenCalled();
        expect(fetchUserTotalFolders).not.toHaveBeenCalled();
        expect(fetchUserFoldersPreview).not.toHaveBeenCalled();
        expect(fetchUserFollowedAuthors).not.toHaveBeenCalled();
        expect(fetchUserTopResearchTopics).not.toHaveBeenCalled();
    });

    it("Propagates repository errors", async () => {
        fetchUserTotalViewedPapers.mockRejectedValue(new Error("Database query failed"));
        fetchUserRecentlyViewedPapers.mockResolvedValue([]);
        fetchUserTotalSavedPapers.mockResolvedValue({ total_saved_papers: "0" });
        fetchUserRecentlySavedPapers.mockResolvedValue([]);
        fetchUserTotalFolders.mockResolvedValue({ total_user_folders: "0" });
        fetchUserFoldersPreview.mockResolvedValue([]);
        fetchUserFollowedAuthors.mockResolvedValue([]);
        fetchUserTopResearchTopics.mockResolvedValue([]);

        await expect(getMyProfile(42)).rejects.toThrow("Database query failed");
    });
});

