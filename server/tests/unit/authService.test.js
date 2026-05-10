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


describe("authService", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // ---------- SUCCESSFUL LOGIN ------------

    it("Fetches a registered user by Username", async () => {
        fetchUserByUsername.mockResolvedValue({
            id: "1",
            username: "ApostolisCoder",
            email: "apostolisCoding@nodejs.com",
            password_hash: "$2b$12$6mrBtyPnCn3nE6u11dQpJewrK6tLb3LtOxHuJ8djrh9YsF.C8jKnS",
            bio: null,
            created_at: "2026-05-09 16:58:35.442164+03",
            updated_at: "2026-05-09 16:58:35.442164+03"
        });

        const credentials = { username: "ApostolisCoder", password: "postgresUser" };

        const user = await login(credentials);

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(user).toEqual({
            id: "1",
            username: "ApostolisCoder",
            email: "apostolisCoding@nodejs.com"
        });
    });

    // ----------- FAILED LOGIN -------------

    it("User provides wrong username during login", async () => {
        fetchUserByUsername.mockResolvedValue(null);

        const credentials = { username: "ApostolisCoding", password: "postgresUser" };

        await expect(login(credentials)).rejects.toThrow("Invalid credentials");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
    });

    it("User provides wrong password during login", async () => {
        fetchUserByUsername.mockResolvedValue({id: "1",
            username: "ApostolisCoder",
            email: "apostolisCoding@nodejs.com",
            password_hash: "$2b$12$6mrBtyPnCn3nE6u11dQpJewrK6tLb3LtOxHuJ8djrh9YsF.C8jKnS",
            bio: null,
            created_at: "2026-05-09 16:58:35.442164+03",
            updated_at: "2026-05-09 16:58:35.442164+03"
        });

        // Wrong password corresponds to different hash
        const credentials = { username: "ApostolisCoder", password: "UserCoding" };

        await expect(login(credentials)).rejects.toThrow("Invalid credentials");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
    });


    // ---------- SUCCESSFUL REGISTRATION ------------

    it("Fetches a new user after Registration", async () => {
        // No other user with either of the input username/email is found
        fetchUserByUsername.mockResolvedValue(null);
        fetchUserByEmail.mockResolvedValue(null);

        createUser.mockResolvedValue({
            id: "6",
            username: "johndoe",
            email: "johndoe@gmail.com",
        });

        const credentials = { 
            username: "johndoe", 
            email: "johndoe@gmail.com", 
            password: "johndoeprogramming"
        };

        const user = await register(credentials);

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(fetchUserByEmail).toHaveBeenCalledWith(credentials.email);
        expect(fetchUserByEmail).toHaveBeenCalledTimes(1);
        expect(createUser).toHaveBeenCalledWith({
            username: credentials.username,
            email: credentials.email,
            passwordHash: expect.any(String)
        });
        expect(createUser).toHaveBeenCalledTimes(1);

        // Validate password Hash has been correctly generated
        const createUserArgs = createUser.mock.calls[0][0];
        expect(createUserArgs.passwordHash).not.toBe(credentials.password);
        await expect(bcryptjs.compare(credentials.password, createUserArgs.passwordHash)).resolves.toBe(true);
        
        expect(user).toEqual({
            id: "6",
            username: "johndoe",
            email: "johndoe@gmail.com"
        });
    });

    // ---------- FAILED REGISTRATION ------------

    it("User provides already taken username", async () => {
        // The retrieved user signals that the username is alredy taken
        fetchUserByUsername.mockResolvedValue({
            id:"5",
            username: "johndoe",
            email: "johndoe@gmail.com",
            password_hash: "$2b$12$Xd3aYRhcIxwoFGsruHrPR.ob3Igeh/mMlnS8izVQkaxMTAvdKxR0u",
            bio: null,
            created_at:	"2026-05-09 20:22:23.439157+03",	
            updated_at: "2026-05-09 20:22:23.439157+03"
        });

        const credentials = { username: "johndoe", email: "johndoealternative@gmail.com", password: "JohnDoeMoneyMan" };

        await expect(register(credentials)).rejects.toThrow("'username' is already registered");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(fetchUserByEmail).not.toHaveBeenCalled();
        expect(createUser).not.toHaveBeenCalled();
    });

    it("User provides already taken email", async () => {
        // Username not taken
        fetchUserByUsername.mockResolvedValue(null);
        // Email taken by retrieved user
        fetchUserByEmail.mockResolvedValue({
            id:"5",
            username: "johndoe",
            email: "johndoe@gmail.com",
            password_hash: "$2b$12$Xd3aYRhcIxwoFGsruHrPR.ob3Igeh/mMlnS8izVQkaxMTAvdKxR0u",
            bio: null,
            created_at:	"2026-05-09 20:22:23.439157+03",	
            updated_at: "2026-05-09 20:22:23.439157+03"
        });

        const credentials = { username: "mrJohndoe", email: "johndoe@gmail.com", password: "JohnDoeMoneyMan" };

        await expect(register(credentials)).rejects.toThrow("'email' is already registered");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(fetchUserByEmail).toHaveBeenCalledWith(credentials.email);
        expect(fetchUserByEmail).toHaveBeenCalledTimes(1);
        expect(createUser).not.toHaveBeenCalled();
    });


    // ------------- DB ERRORS DURING LOGIN AND REGISTRATION -------------

    it("Propagate DB error during Login", async () => {
        fetchUserByUsername.mockRejectedValue(new Error("Database query failed"));

        const credentials = { username: "ApostolisCoder", password: "postgresUser" };

        await expect(login(credentials)).rejects.toThrow("Database query failed");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
    });

    it("Propagate DB error during Registration", async () => {
        // Assuming the query based on the Username was successful
        // But the query based on the email failed
        fetchUserByUsername.mockResolvedValue(null);
        fetchUserByEmail.mockRejectedValue(new Error("Database query failed"));

        const credentials = { username: "mrJohndoe", email: "johndoealternative@gmail.com", password: "JohnDoeMoneyMan" };

        await expect(register(credentials)).rejects.toThrow("Database query failed");

        expect(fetchUserByUsername).toHaveBeenCalledWith(credentials.username);
        expect(fetchUserByUsername).toHaveBeenCalledTimes(1);
        expect(fetchUserByEmail).toHaveBeenCalledWith(credentials.email);
        expect(fetchUserByEmail).toHaveBeenCalledTimes(1);
    });

});

