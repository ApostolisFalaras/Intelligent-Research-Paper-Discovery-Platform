import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("./../../src/repositories/userRepository.js", () => ({
    fetchUserById: vi.fn(),
    updateUserById: vi.fn(),
	deleteUserById: vi.fn(),
}));

vi.mock("./../../src/repositories/profileRepository.js", () => ({
    fetchUserTotalViewedPapers: vi.fn(),
    fetchUserRecentlyViewedPapers: vi.fn(),
    fetchUserTotalSavedPapers: vi.fn(),
    fetchUserRecentlySavedPapers: vi.fn(),
    fetchUserTotalFolders: vi.fn(),
    fetchUserFoldersPreview: vi.fn(),
    fetchFolderPapersPreview: vi.fn(),
    fetchUserFollowedAuthors: vi.fn(),
    fetchUserTopResearchTopics: vi.fn()
}));


let mockUploadedFile = {
    filename: "1-avatar.png"
};

vi.mock("./../../src/middlewares/avatarUpload.js", () => ({
    avatarUpload: {
        single: vi.fn(() => (req, res, next) => {
            req.file = mockUploadedFile;
            next();
        })
    }
}));

// Middleware has to be mocked to authenticate the only existing user in the current tests
let mockAuthenticatedUser = {id: 1};

vi.mock("./../../src/middlewares/authMiddleware.js", async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        authMiddleware: (req, res, next) => {
            req.user = mockAuthenticatedUser;
            req.session.userId = mockAuthenticatedUser?.id ?? null;
            next();
        }
    }
});


import { fetchUserById, updateUserById, deleteUserById, upsertUserLoginTime } from "../../src/repositories/userRepository.js"; 

import {
    fetchUserTotalViewedPapers,
    fetchUserRecentlyViewedPapers,
    fetchUserTotalSavedPapers,
    fetchUserRecentlySavedPapers,
    fetchUserTotalFolders,
    fetchUserFoldersPreview,
    fetchUserFollowedAuthors,
    fetchUserTopResearchTopics
} from "../../src/repositories/profileRepository.js";

import { authMiddleware } from "../../src/middlewares/authMiddleware.js";
import app from "../../src/app.js";


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

describe("GET /api/users/me", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockAuthenticatedUser = {id: 1};
    });

    // ---------- SUCCESSFUL USER PROFILE RETRIEVAL -> 200 OK -----------

    it("Returns 200 when the user profile is retrieved", async () => {
        fetchUserById.mockResolvedValue(mockResolvedUser);

        const response = await request(app).get("/api/users/me").expect(200);

        expect(fetchUserById).toHaveBeenCalledWith(1);
        expect(fetchUserById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual({
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
        });
    });

    // ------------- AUTHENTICATED USER ID NOT SENT IN SERVICE FUNCTION CALL -> 400 BAD REQUEST --------------

    it("Returns 400 when the user id is missing", async () => {
        mockAuthenticatedUser = {id: null};

        const response = await request(app).get("/api/users/me").expect(400);

        expect(fetchUserById).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Missing/Invalid user_id");
    });

    // ------------- AUTHENTICATED USER ID MISSING FROM DB -> 404 NOT FOUND --------------

    it("Returns 404 when the user id is missing from the DB", async () => {
        fetchUserById.mockResolvedValue(null);

        const response = await request(app).get("/api/users/me").expect(404);

        expect(fetchUserById).toHaveBeenCalledWith(1);
        expect(fetchUserById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("User profile not found");
    });

    // ------------- DB ERROR -> 500 SERVER INTERNAL ERROR --------------

    it("Returns 500 when there's an unexpected DB error", async () => {
        fetchUserById.mockRejectedValue(new Error("Database query failed"));

        const response = await request(app).get("/api/users/me").expect(500);

        expect(fetchUserById).toHaveBeenCalledWith(1);
        expect(fetchUserById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Database query failed");
    });
});


describe("GET /api/users/me/profile", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockAuthenticatedUser = { id: 1 };
        mockUploadedFile = {
            filename: "1-avatar.png"
        };
    });

    it("Returns 200 with the user's aggregated profile information", async () => {
        fetchUserTotalViewedPapers.mockResolvedValue({ total_viewed_papers: "12" });

        fetchUserRecentlyViewedPapers.mockResolvedValue([
            {
                paper_id: "386866",
                openalex_id: "W2741809807",
                title: "Example viewed paper",
                primary_topic_display_name: "Machine Learning",
                author_count: "2",
                authors_preview: [
                    { id: "A1", name: "Author One" },
                    { id: "A2", name: "Author Two" }
                ]
            }
        ]);
        fetchUserTotalSavedPapers.mockResolvedValue({ total_saved_papers: "5" });

        fetchUserRecentlySavedPapers.mockResolvedValue([
            {
                paper_id: "891407",
                openalex_id: "W2046766973",
                title: "Example saved paper",
                primary_topic_display_name: "Software Engineering",
                author_count: "3",
                authors_preview: [
                    { id: "A3", name: "Author Three" }
                ]
            }
        ]);

        fetchUserTotalFolders.mockResolvedValue({ total_user_folders: "2" });

        fetchUserFoldersPreview.mockResolvedValue([
            {
                id: 7,
                name: "Machine Learning",
                paper_count: "4",
                color: "blue"
            }
        ]);

        fetchUserFollowedAuthors.mockResolvedValue([
            {
                author_id: "50703",
                openalex_id: "A5107860229",
                author_name: "I. Badhrees",
                created_at: "2026-09-10T12:00:00.000Z"
            }
        ]);

        fetchUserTopResearchTopics.mockResolvedValue([
            {
                topic_openalex_id: "T10048",
                topic_display_name: "Machine Learning",
                works_count: 8
            }
        ]);

        const response = await request(app).get("/api/users/me/profile").expect(200);

        expect(fetchUserTotalViewedPapers).toHaveBeenCalledWith(1);
        expect(fetchUserTotalViewedPapers).toHaveBeenCalledTimes(1);

        expect(fetchUserRecentlyViewedPapers).toHaveBeenCalledWith(1);
        expect(fetchUserRecentlyViewedPapers).toHaveBeenCalledTimes(1);

        expect(fetchUserTotalSavedPapers).toHaveBeenCalledWith(1);
        expect(fetchUserTotalSavedPapers).toHaveBeenCalledTimes(1);

        expect(fetchUserRecentlySavedPapers).toHaveBeenCalledWith(1);
        expect(fetchUserRecentlySavedPapers).toHaveBeenCalledTimes(1);

        expect(fetchUserTotalFolders).toHaveBeenCalledWith(1);
        expect(fetchUserTotalFolders).toHaveBeenCalledTimes(1);

        expect(fetchUserFoldersPreview).toHaveBeenCalledWith(1);
        expect(fetchUserFoldersPreview).toHaveBeenCalledTimes(1);

        expect(fetchUserFollowedAuthors).toHaveBeenCalledWith(1);
        expect(fetchUserFollowedAuthors).toHaveBeenCalledTimes(1);

        expect(fetchUserTopResearchTopics).toHaveBeenCalledWith(1);
        expect(fetchUserTopResearchTopics).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");

        expect(response.body.data).toEqual({
            totalViewedPapers: 12,

            previewViewedPapers: [
                {
                    id: "W2741809807",
                    internalId: "386866",
                    title: "Example viewed paper",
                    primaryTopic: "Machine Learning",
                    authorCount: 2,
                    authorsPreview: [
                        { id: "A1", name: "Author One" },
                        { id: "A2", name: "Author Two" }
                    ]
                }
            ],

            totalSavedPapers: 5,

            previewSavedPapers: [
                {
                    id: "W2046766973",
                    internalId: "891407",
                    title: "Example saved paper",
                    primaryTopic: "Software Engineering",
                    authorCount: 3,
                    authorsPreview: [
                        { id: "A3", name: "Author Three" }
                    ]
                }
            ],

            totalFolders: 2,

            previewFolders: [
                {
                    id: 7,
                    name: "Machine Learning",
                    paperCount: 4,
                    color: "blue"
                }
            ],

            authorsFollowed: [
                {
                    id: "A5107860229",
                    internalId: "50703",
                    authorName: "I. Badhrees",
                    createdAt: "2026-09-10T12:00:00.000Z"
                }
            ],

            researchTopics: [
                {
                    topic_openalex_id: "T10048",
                    topic_display_name: "Machine Learning",
                    works_count: 8
                }
            ]
        });
    });

    it("Returns 400 when the authenticated user id is invalid", async () => {
        mockAuthenticatedUser = { id: null };

        const response = await request(app).get("/api/users/me/profile").expect(400);

        expect(fetchUserTotalViewedPapers).not.toHaveBeenCalled();
        expect(fetchUserRecentlyViewedPapers).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Missing/Invalid user_id");
    });

    it("Returns 500 when profile retrieval fails", async () => {
        fetchUserTotalViewedPapers.mockRejectedValue(new Error("Database query failed"));

        const response = await request(app).get("/api/users/me/profile").expect(500);

        expect(fetchUserTotalViewedPapers).toHaveBeenCalledWith(1);
        expect(fetchUserTotalViewedPapers).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe(
            "Database query failed"
        );
    });
});

describe("PATCH /api/users/me/profile", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockAuthenticatedUser = {id: 1};
    });

    // ---------- SUCCESSFUL CASES ----------

    it("Returns 200 when the user profile is successfully updated", async () => {
		updateUserById.mockResolvedValue(1);

		const response = await request(app)
			.patch("/api/users/me/profile")
			.send({ 
                firstName: "Apostolis", lastName: "Falaras",
				location: "Greece", role: "Software Engineer"
			})
			.expect(200);

		expect(updateUserById).toHaveBeenCalledWith(1, {
			firstName: "Apostolis",
			lastName: "Falaras",
			location: "Greece",
			role: "Software Engineer"
		});

		expect(response.body.status).toEqual("success");
        expect(response.body.message).toEqual("User profile updated successfully");
	});

    // ---------- ERROR CASES ----------

	it("Returns 400 when no modified fields are provided", async () => {
		const response = await request(app)
			.patch("/api/users/me/profile")
			.send({})
			.expect(400);

		expect(updateUserById).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe(
			"No modified fields were provided"
		);
	});

	it("Returns 400 when profile update data is invalid", async () => {
		const response = await request(app)
			.patch("/api/users/me/profile")
			.send({
				firstName: 123
			})
			.expect(400);

		expect(updateUserById).not.toHaveBeenCalled();

		expect(response.body.status).toBe("fail");
	});

	it("Returns 404 when the user does not exist", async () => {
		updateUserById.mockResolvedValue(0);

		const response = await request(app)
			.patch("/api/users/me/profile")
			.send({
				firstName: "Apostolis"
			})
			.expect(404);

		expect(updateUserById).toHaveBeenCalledWith(1, {
			firstName: "Apostolis"
		});

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("User not found");
	});

	it("Returns 500 when profile update unexpectedly fails", async () => {
		updateUserById.mockRejectedValue(
			new Error("Unexpected DB error")
		);

		const response = await request(app)
			.patch("/api/users/me/profile")
			.send({
				firstName: "Apostolis"
			})
			.expect(500);

		expect(response.body.status).toBe("error");
		expect(response.body.message).toBe("Unexpected DB error");
	});
});


describe("DELETE /api/users/me/profile", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockAuthenticatedUser = {id: 1};
    });

    // ---------- SUCCESSFUL CASES ----------

    it("Returns 200 when the user profile is successfully deleted", async () => {
		deleteUserById.mockResolvedValue(1);

		const response = await request(app)
			.delete("/api/users/me/profile")
			.expect(200);

		expect(deleteUserById).toHaveBeenCalledWith(1);
		expect(deleteUserById).toHaveBeenCalledTimes(1);

		expect(response.body.status).toEqual("success");
        expect(response.body.message).toEqual("User profile deleted successfully");
	});

	it("Returns 404 when the user does not exist", async () => {
		deleteUserById.mockResolvedValue(0);

		const response = await request(app)
			.delete("/api/users/me/profile")
			.expect(404);

		expect(deleteUserById).toHaveBeenCalledWith(1);

		expect(response.body.status).toBe("fail");
		expect(response.body.message).toBe("User not found");
	});

	it("Returns 500 when profile deletion unexpectedly fails", async () => {
		deleteUserById.mockRejectedValue(
			new Error("Unexpected DB error")
		);

		const response = await request(app)
			.delete("/api/users/me/profile")
			.expect(500);

		expect(response.body.status).toBe("error");
		expect(response.body.message).toBe("Unexpected DB error");
	});
})


describe("POST /api/users/me/profile/avatar", () => {
    beforeEach(() => {
        vi.resetAllMocks();

        mockAuthenticatedUser = { id: 1 };

        mockUploadedFile = {
            filename: "1-avatar.png"
        };
    });

    it("Returns 200 and stores the uploaded avatar URL", async () => {
        updateUserById.mockResolvedValue(1);

        const response = await request(app).post("/api/users/me/profile/avatar").expect(200);

        expect(updateUserById).toHaveBeenCalledWith(1, { avatarURL: "/uploads/avatars/1-avatar.png" });

        expect(updateUserById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");

        expect(response.body.data).toEqual({ avatarURL: "/uploads/avatars/1-avatar.png" });
    });

    it("Returns 400 when no avatar file is provided", async () => {
        mockUploadedFile = null;

        const response = await request(app).post("/api/users/me/profile/avatar").expect(400);

        expect(updateUserById).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Avatar image is required");
    });

    it("Returns 404 when the user no longer exists", async () => {
        updateUserById.mockResolvedValue(0);

        const response = await request(app).post("/api/users/me/profile/avatar").expect(404);

        expect(updateUserById).toHaveBeenCalledWith(1, { avatarURL: "/uploads/avatars/1-avatar.png" });
        expect(updateUserById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("User not found");
    });

    it("Returns 500 when saving the avatar URL fails", async () => {
        updateUserById.mockRejectedValue(new Error("Database query failed"));

        const response = await request(app).post("/api/users/me/profile/avatar").expect(500);

        expect(updateUserById).toHaveBeenCalledWith(1, { avatarURL: "/uploads/avatars/1-avatar.png" });
        expect(updateUserById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Database query failed");
    });
});


describe("DELETE /api/users/me/profile/avatar", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockAuthenticatedUser = { id: 1 };
    });

    it("Returns 200 when the avatar is successfully removed", async () => {
        fetchUserById.mockResolvedValue({...mockResolvedUser, avatar_url: null});

        updateUserById.mockResolvedValue(1);

        const response = await request(app).delete("/api/users/me/profile/avatar").expect(200);

        expect(fetchUserById).toHaveBeenCalledWith(1);
        expect(fetchUserById).toHaveBeenCalledTimes(1);

        expect(updateUserById).toHaveBeenCalledWith(1, { avatarURL: null });

        expect(response.body.status).toBe("success");
        expect(response.body.message).toBe("User avatar deleted successfully");
    });

    it("Returns 404 when the user does not exist", async () => {
        fetchUserById.mockResolvedValue(null);

        const response = await request(app).delete("/api/users/me/profile/avatar").expect(404);

        expect(fetchUserById).toHaveBeenCalledWith(1);
        expect(fetchUserById).toHaveBeenCalledTimes(1);

        expect(updateUserById).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("User not found");
    });

    it("Returns 500 when the stored avatar path is invalid", async () => {
        fetchUserById.mockResolvedValue({
            ...mockResolvedUser,
            avatar_url: "/some/invalid/path/avatar.png"
        });

        const response = await request(app).delete("/api/users/me/profile/avatar").expect(500);

        expect(fetchUserById).toHaveBeenCalledWith(1);
        expect(fetchUserById).toHaveBeenCalledTimes(1);

        expect(updateUserById).not.toHaveBeenCalled();

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Invalid avatar path");
    });

    it("Returns 500 when fetching the user fails", async () => {
        fetchUserById.mockRejectedValue(new Error("Database query failed"));

        const response = await request(app).delete("/api/users/me/profile/avatar").expect(500);

        expect(fetchUserById).toHaveBeenCalledWith(1);
        expect(fetchUserById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Database query failed");
    });
});