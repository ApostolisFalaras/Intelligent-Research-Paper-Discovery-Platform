import { describe, it, expect, vi, beforeEach } from "vitest";
import bcryptjs from "bcryptjs";

// Mock the repository functions the fetch and create a user
vi.mock("./../../src/repositories/userRepository.js", () => ({
    fetchUserByUsername: vi.fn(),
    fetchUserByEmail: vi.fn(),
    createUser: vi.fn(),
}));

// Import after to replace the real functions with the mock functions
import { createUser, fetchUserByEmail, fetchUserByUsername } from "../../src/repositories/userRepository";
import { login, register } from "./../../src/services/authService.js";


const mockResolvedUser = {
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

const registrationCredentials = {
    username: "ApostolisCoder",
    email: "apostolisCoder@email.com",
    password: "postgresUSER",
    firstName: "Apostolis",
    lastName: "Falaras",
    affiliation: "None",
    role: "Full-Stack Software Engineer",
    bio: "Junior Full-Stack Engineer currently studying Node.js and React",
    avatarURL: "None"
};

describe("authService", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL LOGIN ------------

    it("Fetches a registered user by Username", async () => {
        fetchUserByUsername.mockResolvedValue(mockResolvedUser);

        const  credentials = { username: "ApostolisCoder", password: "postgresUSER" };

        const user = await login(credentials);

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(user).toEqual({
            id: 1,
            username: "ApostolisCoder",
            email: "apostolisCoder@email.com"
        });
    });

    // ----------- FAILED LOGIN -------------

    it("Throws 401 as the user provides wrong username during login", async () => {
        fetchUserByUsername.mockResolvedValue(null);

        const  credentials = { username: "ApostolisCoding", password: "postgresUSER" };

        await expect(login(credentials)).rejects.toThrow("Invalid credentials");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
    });

    it("Throws 401 as the user provides wrong password during login", async () => {
        fetchUserByUsername.mockResolvedValue(mockResolvedUser);

        // Wrong password corresponds to different hash
        const  credentials = { username: "ApostolisCoder", password: "UserCoding" };

        await expect(login( credentials)).rejects.toThrow("Invalid credentials");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
    });


    // ---------- SUCCESSFUL REGISTRATION ------------

    it("Fetches a new user after Registration", async () => {
        // No other user with either of the input username/email is found
        fetchUserByUsername.mockResolvedValue(null);
        fetchUserByEmail.mockResolvedValue(null);

        createUser.mockResolvedValue(mockResolvedUser);

        const user = await register(registrationCredentials);

        expect(fetchUserByUsername).toHaveBeenCalledWith(registrationCredentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(fetchUserByEmail).toHaveBeenCalledWith(registrationCredentials.email);
        expect(fetchUserByEmail).toHaveBeenCalledTimes(1);
        
        expect(createUser).toHaveBeenCalledWith({
            username:  registrationCredentials.username,
            email:  registrationCredentials.email,
            password_hash: expect.any(String),
            first_name:  registrationCredentials.firstName,
            last_name:  registrationCredentials.lastName,
            affiliation:  registrationCredentials.affiliation,
            role:  registrationCredentials.role,
            bio:  registrationCredentials.bio,
            avatar_url:  registrationCredentials.avatarURL,
        });
        expect(createUser).toHaveBeenCalledTimes(1);

        // Validate password Hash has been correctly generated
        const createUserArgs = createUser.mock.calls[0][0];
        expect(createUserArgs.passwordHash).not.toBe(registrationCredentials.password);
        await expect(bcryptjs.compare(registrationCredentials.password, createUserArgs.password_hash)).resolves.toBe(true);
        
        expect(user).toEqual({
            id: 1,
            username: "ApostolisCoder",
            email: "apostolisCoder@email.com"
        });
    });

    // ---------- FAILED REGISTRATION ------------

    it("Throws a 409 AppError as the user provides already taken username", async () => {
        // The retrieved user signals that the username is alredy taken
        fetchUserByUsername.mockResolvedValue(mockResolvedUser);

        const  credentials = { username: "ApostolisCoder", email: "apostolisperformative@email.com", password: "ApostolisMoneyMan" };

        await expect(register({
                ...registrationCredentials,
                username: "ApostolisCoder",
                email: "apostolisperformative@email.com",
                password: "ApostolisMoneyMan"
            }
        )).rejects.toThrow("'username' is already registered");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(fetchUserByEmail).not.toHaveBeenCalled();
        expect(createUser).not.toHaveBeenCalled();
    });

    it("Throws a 409 AppError aUser provides already taken email", async () => {
        // Username not taken
        fetchUserByUsername.mockResolvedValue(null);
        // Email taken by retrieved user
        fetchUserByEmail.mockResolvedValue(mockResolvedUser);

        const  credentials = { username: "apostolis2ndAccount", email: "apostolisCoder@email.com", password: "ApostolisMoneyMan" };

        await expect(register({
                ...registrationCredentials,
                username: "apostolis2ndAccount",
                email: "apostolisCoder@email.com",
                password: "ApostolisMoneyMan"
            }
        )).rejects.toThrow("'email' is already registered");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(fetchUserByEmail).toHaveBeenCalledWith(credentials.email);
        expect(fetchUserByEmail).toHaveBeenCalledTimes(1);
        expect(createUser).not.toHaveBeenCalled();
    });


    // ------------- DB ERRORS DURING LOGIN AND REGISTRATION -------------

    it("Propagate DB error during Login", async () => {
        fetchUserByUsername.mockRejectedValue(new Error("Database query failed"));

        const  credentials = { username: "ApostolisCoder", password: "postgresUser" };

        await expect(login(credentials)).rejects.toThrow("Database query failed");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
    });

    it("Propagate DB error during Registration", async () => {
        // Assuming the query based on the Username was successful
        // But the query based on the email failed
        fetchUserByUsername.mockResolvedValue(null);
        fetchUserByEmail.mockRejectedValue(new Error("Database query failed"));

        await expect(register(registrationCredentials)).rejects.toThrow("Database query failed");

        expect(fetchUserByUsername).toHaveBeenCalledWith(registrationCredentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(fetchUserByEmail).toHaveBeenCalledWith(registrationCredentials.email);
        expect(fetchUserByEmail).toHaveBeenCalledTimes(1);
    });

    // 

});

