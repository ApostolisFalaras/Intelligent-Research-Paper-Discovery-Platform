import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("./../../src/repositories/userRepository.js", () => ({
    fetchUserById: vi.fn(),
    updateUserById: vi.fn(),
	deleteUserById: vi.fn(),
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

import { fetchUserById, updateUserById, deleteUserById, upsertUserLoginTime } from "../../src/repositories/userRepository.js"; 
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
