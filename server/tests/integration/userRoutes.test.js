import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("./../../src/repositories/userRepository.js", () => ({
    fetchUserById: vi.fn()
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

import { fetchUserById } from "./../../src/repositories/userRepository.js"; 
import { authMiddleware } from "./../../src/middlewares/authMiddleware.js";
import app from "./../../src/app.js";

const mockResolveUserProfile = {
    id: 1,
    username: "ApostolisCoder",
    email: "apostolisCoder@email.com",
    password_hash: "$2b$12$UMTLXzUIPGvMbmnMtjvW4u43BQXoZG6oKK3Yhm.ai9kclBAB/0xD6",
    first_name: "Apostolis",
    last_name: "Falaras",
    affiliation: "None",
    role: "Full-Stack Software Engineer",
    bio: "Junior Full-Stack Engineer currently studying Node.js and React",
    avatar_url: "None",
    created_at: "2026-05-09 16:58:35.442164+03",
    updated_at: "2026-05-09 16:58:35.442164+03"
};

describe("fetchUserById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockAuthenticatedUser = {id: 1};
    });

    // ---------- SUCCESSFUL USER PROFILE RETRIEVAL -> 200 OK -----------

    it("Returns 200 when the user profile is retrieved", async () => {
        fetchUserById.mockResolvedValue(mockResolveUserProfile);

        const response = await request(app).get("/api/users/me").expect(200);

        expect(fetchUserById).toHaveBeenCalledWith(1);
        expect(fetchUserById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual({
            id: 1,
            username: mockResolveUserProfile.username,
            email: mockResolveUserProfile.email,
            firstName: mockResolveUserProfile.first_name,
            lastName: mockResolveUserProfile.last_name,
            affiliation: mockResolveUserProfile.affiliation,
            role: mockResolveUserProfile.role,
            bio: mockResolveUserProfile.bio,
            createdAt: mockResolveUserProfile.created_at,
            updatedAt: mockResolveUserProfile.updated_at
        });
    });

    // ------------- AUTHENTICATED USER ID NOT SENT IN SERVICE FUNCTION CALL -> 400 BAD REQUEST --------------

    it("Returns 400 when the user id is not sent in the service call", async () => {
        mockAuthenticatedUser = {id: null};

        const response = await request(app).get("/api/users/me").expect(400);

        expect(fetchUserById).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Missing/Invalid user_id");
    });

    // ------------- AUTHENTICATED USER ID NOT A NUMBER -> 400 BAD REQUEST --------------

    it("Returns 400 when the user id is not a number", async () => {
        mockAuthenticatedUser = {id: "1"};

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