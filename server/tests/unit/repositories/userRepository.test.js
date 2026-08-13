import { describe, it, expect, vi, beforeEach } from "vitest";
import bcryptjs from "bcryptjs";

vi.mock("../../../src/config/db.js", () => ({
    default: {
        query: vi.fn(),
    }
}));

import pool from "../../../src/config/db.js";
import { fetchUserByUsername, fetchUserByEmail, createUser, 
        fetchUserById, updateUserById, deleteUserById } from "../../../src/repositories/userRepository.js";


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

describe("updateUserById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });


    it("dynamically updates only the provided profile fields", async () => {
        pool.query.mockResolvedValue({
            rowCount: 1
        });

        const updates = {
            firstName: "Apostolis",
            affiliation: "University of Thessaly",
            role: "Software Engineer"
        };

        const result = await updateUserById(42, updates);

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("UPDATE users");

        expect(query).toContain("first_name = $1");
        expect(query).toContain("affiliation = $2");
        expect(query).toContain("role = $3");

        expect(query).toContain(
            "updated_at = CURRENT_TIMESTAMP"
        );

        expect(query).toContain("WHERE id = $4");
        expect(params).toEqual([ "Apostolis", "University of Thessaly","Software Engineer", 42]);
        expect(result).toBe(1);
    });

    it("maps passwordHash to the password_hash database column", async () => {
        pool.query.mockResolvedValue({ rowCount: 1 });

        await updateUserById(42, { passwordHash: "hashed-password" });

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("password_hash = $1");
        expect(query).toContain("WHERE id = $2");
        expect(params).toEqual([ "hashed-password", 42 ]);
    });

    it("ignores unsupported fields", async () => {
        pool.query.mockResolvedValue({ rowCount: 1 });

        await updateUserById(42, { firstName: "Apostolis", invalidField: "ignored" });

        const [query, params] = pool.query.mock.calls[0];

        expect(query).toContain("first_name = $1");
        expect(query).not.toContain("invalidField");
        expect(params).toEqual([ "Apostolis", 42 ]);
    });

    it("Returns null without querying when no valid fields are provided", async () => {
        const result = await updateUserById(42, { invalidField: "ignored" });

        expect(result).toBeNull();
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("Returns zero when no user row was updated", async () => {
        pool.query.mockResolvedValue({ rowCount: 0 });

        const result = await updateUserById(999, { firstName: "Apostolis"});

        expect(result).toBe(0);
    });
});


describe("deleteUserById", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Deletes the user by id", async () => {
        pool.query.mockResolvedValue({ rowCount: 1 });

        const result = await deleteUserById(42);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("DELETE FROM users"),
            [42]
        );

        expect(result).toBe(1);
    });

    it("Returns zero when the user does not exist", async () => {
        pool.query.mockResolvedValue({ rowCount: 0 });

        const result = await deleteUserById(999);

        expect(result).toBe(0);
    });
    
});