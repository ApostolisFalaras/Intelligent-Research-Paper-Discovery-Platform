import { describe, it, expect, vi, beforeEach } from "vitest";
import bcryptjs from "bcryptjs";

vi.mock("../../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    }
}));

import pool from "../../../src/config/db.js";
import { fetchUserByUsername, fetchUserByEmail, createUser, fetchUserById } from "../../../src/repositories/userRepository.js";


const mockResolvedUser = {
    id: "1",
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

// It's the same as the mockResolvedUser but without the password_hash, 
// since this object is meant to be displayed in the user profile
const mockResolvedProfile = {
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


describe("userRepository", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ------------ USER RETRIEVAL BASED ON ID -------------
    it("Fetch a user based on their id", async () => {
        pool.query.mockResolvedValue({
            rows: [ mockResolvedProfile ]
        });

        const expectedOutput = mockResolvedProfile;

        const result = await fetchUserById(1);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM users");
        expect(query).toContain("WHERE id = $1;");
        expect(params).toEqual([1]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedOutput);
    });

    // ------------ USER RETRIEVAL BASED ON USERNAME -------------
    it("Fetch a user based on their username", async () => {
        pool.query.mockResolvedValue({
            rows: [ mockResolvedUser ]
        });

        const expectedOutput = mockResolvedUser

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
            rows: [ mockResolvedUser ]
        });

        const expectedOutput = mockResolvedUser;

        const email = "apostolisCoder@email.com";

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

    // Retrieval by id
    it("Returning null when user doesn't exist for an id", async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const result = await fetchUserById(2);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("SELECT *");
        expect(query).toContain("FROM users");
        expect(query).toContain("WHERE id = $1;");
        expect(params).toEqual([2]);

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(result).toBe(null);
    });

    // Retrieval by username
    it("Returning null when user doesn't exist for a username", async () => {
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
        
        const passwordHash = await bcryptjs.hash(registrationCredentials.password, 12);
        
        const user = await createUser({
                username: registrationCredentials.username,
                email: registrationCredentials.email,
                password_hash: passwordHash,
                first_name: registrationCredentials.firstName,
                last_name: registrationCredentials.lastName,
                affiliation: registrationCredentials.affiliation,
                location: registrationCredentials.location,
                role: registrationCredentials.role
            });

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("INSERT INTO users (username, email, password_hash,");
        expect(query).toContain("first_name, last_name, affiliation, location, role)");
        expect(query).toContain("VALUES ($1, $2, $3, $4, $5, $6, $7, $8)");
        expect(query).toContain("RETURNING id, username, email;");

        
        expect(params).toEqual([
            registrationCredentials.username,
            registrationCredentials.email,
            passwordHash,
            registrationCredentials.firstName,
            registrationCredentials.lastName,
            registrationCredentials.affiliation,
            registrationCredentials.location,
            registrationCredentials.role
        ]);
        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(user).toEqual(expectedOutput);
    });

    // ----------- PROPAGATE DB ERROR ---------------

    it("createUser propagates DB error", async () => {
        pool.query.mockRejectedValue(new Error("Database query failed"));

        const passwordHash = await bcryptjs.hash(registrationCredentials.password, 12);
        
        await expect(createUser({
                username: registrationCredentials.username,
                email: registrationCredentials.email,
                password_hash: passwordHash,
                first_name: registrationCredentials.firstName,
                last_name: registrationCredentials.lastName,
                affiliation: registrationCredentials.affiliation,
                location: registrationCredentials.location,
                role: registrationCredentials.role
            }
        )).rejects.toThrow("Database query failed");
        
        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("INSERT INTO users (username, email, password_hash");
        expect(query).toContain("first_name, last_name, affiliation, location, role)");
        expect(query).toContain("VALUES ($1, $2, $3, $4, $5, $6, $7, $8)");
        expect(query).toContain("RETURNING id, username, email;");

        expect(params).toEqual([
            registrationCredentials.username,
            registrationCredentials.email,
            passwordHash,
            registrationCredentials.firstName,
            registrationCredentials.lastName,
            registrationCredentials.affiliation,
            registrationCredentials.location,
            registrationCredentials.role
        ]);

        expect(pool.query).toHaveBeenCalledTimes(1);
    });
});