import { describe, it, expect, vi, beforeEach } from "vitest";
import bcryptjs from "bcryptjs";

vi.mock("./../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    }
}));

import pool from "./../../src/config/db.js";
import { fetchUserByUsername, fetchUserByEmail, createUser } from "./../../src/repositories/userRepository.js";

describe("userRepository", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ------------ USER RETRIEVAL BASED ON USERNAME -------------
    it("Fetch a user based on their username", async () => {
        pool.query.mockResolvedValue({
            rows: [
                {
                    id: "1",
                    username: "ApostolisCoder",
                    email: "apostolisCoding@nodejs.com",
                    password_hash: "$2b$12$6mrBtyPnCn3nE6u11dQpJewrK6tLb3LtOxHuJ8djrh9YsF.C8jKnS",
                    bio: null,
                    created_at: "2026-05-09 16:58:35.442164+03",
                    updated_at: "2026-05-09 16:58:35.442164+03"
                }
            ]
        });

        const expectedOutput = {
            id: "1",
            username: "ApostolisCoder",
            email: "apostolisCoding@nodejs.com",
            password_hash: "$2b$12$6mrBtyPnCn3nE6u11dQpJewrK6tLb3LtOxHuJ8djrh9YsF.C8jKnS",
            bio: null,
            created_at: "2026-05-09 16:58:35.442164+03",
            updated_at: "2026-05-09 16:58:35.442164+03"
        };

        const username = "ApostolisCoder";

        const user = await fetchUserByUsername(username);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM users");
        expect(query).toContain("WHERE username = $1;");
        expect(params).toEqual([username]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(user).toEqual(expectedOutput);
    });

    
    // ------------ USER RETRIEVAL BASED ON EMAIL -------------
    it("Fetch a user based on their email", async () => {
        pool.query.mockResolvedValue({
            rows: [
                {
                    id: "1",
                    username: "ApostolisCoder",
                    email: "apostolisCoding@nodejs.com",
                    password_hash: "$2b$12$6mrBtyPnCn3nE6u11dQpJewrK6tLb3LtOxHuJ8djrh9YsF.C8jKnS",
                    bio: null,
                    created_at: "2026-05-09 16:58:35.442164+03",
                    updated_at: "2026-05-09 16:58:35.442164+03"
                }
            ]
        });

        const expectedOutput = {
            id: "1",
            username: "ApostolisCoder",
            email: "apostolisCoding@nodejs.com",
            password_hash: "$2b$12$6mrBtyPnCn3nE6u11dQpJewrK6tLb3LtOxHuJ8djrh9YsF.C8jKnS",
            bio: null,
            created_at: "2026-05-09 16:58:35.442164+03",
            updated_at: "2026-05-09 16:58:35.442164+03"
        };

        const email = "apostolisCoding@nodejs.com";

        const user = await fetchUserByEmail(email);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM users");
        expect(query).toContain("WHERE email = $1;");
        expect(params).toEqual([email]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(user).toEqual(expectedOutput);
    });

    // ------------- RETRIEVAL OF NULL WHEN USER DOESNT EXIST -------------

    // Retrieval be username
    it("Returning null when user doesn't exist for username", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const username = "ApostolisCoding";

        const user = await fetchUserByUsername(username);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM users");
        expect(query).toContain("WHERE username = $1;");
        expect(params).toEqual([username]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(user).toEqual(null);
    });

    // Retrieval by email
    it("Returning null when user doesn't exist for an email", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const email = "apostoliscoding@gmail.com";

        const user = await fetchUserByEmail(email);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM users");
        expect(query).toContain("WHERE email = $1;");
        expect(params).toEqual([email]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(user).toEqual(null);
    });


    // ----------- CREATE USER ---------------
    it("Create newly-registered user", async () => {
        pool.query.mockResolvedValue({
            rows: [
                {
                    id: "1",
                    username: "ApostolisCoder",
                    email: "apostolisCoding@nodejs.com",
                    created_at: "2026-05-09 16:58:35.442164+03",
                }
            ]
        });

        const expectedOutput = {
            id: "1",
            username: "ApostolisCoder",
            email: "apostolisCoding@nodejs.com",
            created_at: "2026-05-09 16:58:35.442164+03",
        };
        
        const passwordHash = await bcryptjs.hash("postgresUser", 12);
        const credentials = { 
            username: "ApostolisCoder", 
            email: "apostolisCoding@nodejs.com", 
            passwordHash
        };

        const user = await createUser(credentials);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("INSERT INTO users (username, email, password_hash)");
        expect(query).toContain("VALUES ($1, $2, $3)");
        expect(query).toContain("RETURNING id, username, email, created_at;");

        
        expect(params).toEqual([credentials.username, credentials.email, credentials.passwordHash]);
        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(user).toEqual(expectedOutput);
    });

    // ----------- PROPAGATE DB ERROR ---------------

    it("fetchUserByUsername propagates DB error", async () => {
        pool.query.mockRejectedValue(new Error("Database query failed"));

        const username = "ApostolisCoder";

        await expect(fetchUserByUsername(username)).rejects.toThrow("Database query failed");
        
        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM users");
        expect(query).toContain("WHERE username = $1;");
        expect(params).toEqual([username]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        
    });

    it("fetchUserByEmail propagates DB error", async () => {
        pool.query.mockRejectedValue(new Error("Database query failed"));

        const email = "apostoliscoding@gmail.com";
        
        await expect(fetchUserByEmail(email)).rejects.toThrow("Database query failed");
        
        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM users");
        expect(query).toContain("WHERE email = $1;");
        expect(params).toEqual([email]);

        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it("createUser propagates DB error", async () => {
        pool.query.mockRejectedValue(new Error("Database query failed"));

        const passwordHash = await bcryptjs.hash("postgresUser", 12);

        const credentials = { 
            username: "ApostolisCoder", 
            email: "apostolisCoding@nodejs.com", 
            passwordHash
        };
        
        await expect(createUser(credentials)).rejects.toThrow("Database query failed");
        
        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("INSERT INTO users (username, email, password_hash)");
        expect(query).toContain("VALUES ($1, $2, $3)");
        expect(query).toContain("RETURNING id, username, email, created_at;");
        expect(params).toEqual([credentials.username, credentials.email, credentials.passwordHash]);

        expect(pool.query).toHaveBeenCalledTimes(1);
    });
});