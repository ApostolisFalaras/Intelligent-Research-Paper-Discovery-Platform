import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("./../../src/repositories/userRepository.js", () => ({
    fetchUserByUsername: vi.fn(),
    fetchUserByEmail: vi.fn(),
    createUser: vi.fn()
}));

import { fetchUserByUsername, fetchUserByEmail, createUser } from "./../../src/repositories/userRepository.js";
import app from "./../../src/app.js";


const mockResolvedUser = {
    id: 1,
    username: "ApostolisCoder",
    email: "apostolisCoder@email.com",
    password_hash: "$2b$12$UMTLXzUIPGvMbmnMtjvW4u43BQXoZG6oKK3Yhm.ai9kclBAB/0xD6",
    first_name: "Apostolis",
    last_name: "Falaras",
    affiliation: "None",
    location: "Greece",
    role: "Full-Stack Software Engineer",
    bio: "Junior Full-Stack Engineer currently studying Node.js and React",
    avatar_url: "None",
    created_at: "2026-05-09 16:58:35.442164+03",
    updated_at: "2026-05-09 16:58:35.442164+03"
};

const registrationCredentials = {
    username: "ApostolisCoder",
    email: "apostolisCoder@email.com",
    password: "postgresUSER",
    firstName: "Apostolis",
    lastName: "Falaras",
    affiliation: "None",
    location: "Greece",
    role: "Full-Stack Software Engineer",
    bio: "Junior Full-Stack Engineer currently studying Node.js and React",
    avatarURL: "None"
};

describe("POST /api/auth/login", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL LOGIN -----------

    it("Returns 200 when the user is authenticated", async () => {
        fetchUserByUsername.mockResolvedValue(mockResolvedUser);

        const credentials = { username: "apostolisCoder", password: "postgresUSER" }

        const response = await request(app).post("/api/auth/login").send(credentials).expect(200);

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual({
            user: {
                id: 1,
                username: "ApostolisCoder",
                email: "apostolisCoder@email.com"
            }   
        });
    });

    // ------------ MISSING USERNAME/PASSWORD -> 400 BAD REQUEST ------------ 

    it("Returns 400 when the password is missing", async () => {
        // I choose a missing password
        // Although the same applies for a missing username
        const credentials = {
            ...registrationCredentials,
            password: null
        };

        const response = await request(app).post("/api/auth/login").send(credentials).expect(400);

        expect(fetchUserByUsername).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("'username', and 'password' are required");
    });

    // ------------ WRONG USERNAME/PASSWORD -> 401 NOT AUTHENTICATED --------------

    it("Returns 401 when the password is wrong", async () => {
        fetchUserByUsername.mockResolvedValue(mockResolvedUser);

        // I choose a wrong password
        // Although the same can apply to a wrong username
        const credentials = { 
            ...registrationCredentials,
            password: "POSTGREsUSER"
        }; // real password: postgresUser

        const response = await request(app).post("/api/auth/login").send(credentials).expect(401);

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Invalid credentials");
    });

    // ------------ DB ERROR -> 500 INTERNAL SERVER ERROR ------------

    it("Returns 500 when the DB failed unexpectedly", async () => {
        fetchUserByUsername.mockRejectedValue(new Error("Database query failed"));

        const response = await request(app).post("/api/auth/login").send(registrationCredentials).expect(500);

        expect(fetchUserByUsername).toHaveBeenCalledWith(registrationCredentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Database query failed");
    });

});

describe("POST /api/auth/register", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL REGISTRATION -----------

    it("Returns 201 when the user is registered", async () => {
        // Registration succeeds when no current user has the newly-inserted username & email
        fetchUserByUsername.mockResolvedValue(null);
        fetchUserByEmail.mockResolvedValue(null);
        createUser.mockResolvedValue(mockResolvedUser);

        const response = await request(app).post("/api/auth/register").send(registrationCredentials).expect(201);

        expect(fetchUserByUsername).toHaveBeenCalledWith(registrationCredentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(fetchUserByEmail).toHaveBeenCalledWith(registrationCredentials.email);
        expect(fetchUserByEmail).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual({
            user: {
                id: 1,
                username: registrationCredentials.username,
                email: registrationCredentials.email,
            }
        });
    });

    // ------------ MISSING USERNAME/EMAIL/PASSWORD -> 400 BAD REQUEST ------------

    it("Returns 400 when the password is missing", async () => {
        
        // I choose a missing password
        // But the same can apply for username and email
        const credentials = { 
            ...registrationCredentials,
            password: null
        };

        const response = await request(app).post("/api/auth/register").send(credentials).expect(400);

        expect(fetchUserByUsername).not.toHaveBeenCalled();
        expect(fetchUserByEmail).not.toHaveBeenCalled();
        expect(createUser).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("'username', 'email' and 'password' are required");
    });

    // -------------- ALREADY EXISTING USERNAME IN DB -> 409 CONFLICT ----------------

    it("Returns 409 when the username already exists", async () => {
        // Username matches with a user
        fetchUserByUsername.mockResolvedValue(mockResolvedUser);

        const response = await request(app).post("/api/auth/register").send(registrationCredentials).expect(409);

        expect(fetchUserByUsername).toHaveBeenCalledWith(registrationCredentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("'username' is already registered");
    });

    // -------------- ALREADY EXISTING EMAIL IN DB -> 409 CONFLICT ----------------
    
    it("Returns 409 when the email already exists", async () => {
        // Username doesn't match with any user
        fetchUserByUsername.mockResolvedValue(null);
        // But the email matches with an existing user
        fetchUserByEmail.mockResolvedValue(mockResolvedUser);

        const response = await request(app).post("/api/auth/register").send(registrationCredentials).expect(409);

        expect(fetchUserByUsername).toHaveBeenCalledWith(registrationCredentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(fetchUserByEmail).toHaveBeenCalledWith(registrationCredentials.email);
        expect(fetchUserByEmail).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("'email' is already registered");
    });

    // ------------ DB ERROR -> 500 INTERNAL SERVER ERROR ------------

    it("Returns 500 when the DB failed unexpectedly", async () => {
        // Database can fail on 3 calls,
        // On the 2 checks for currently taken up username and email
        // And on the insertion query in the users table. For simplicity, I choose the 1st check
        fetchUserByUsername.mockRejectedValue(new Error("Database query failed"));

        const response = await request(app).post("/api/auth/register").send(registrationCredentials).expect(500);

        expect(fetchUserByUsername).toHaveBeenCalledWith(registrationCredentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Database query failed");
    });
});