import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/repositories/userRepository.js", () => ({
    fetchUserById: vi.fn(),
    updateUserById: vi.fn(),
    deleteUserById: vi.fn()
}));


vi.mock("bcryptjs", () => ({
    default: {
        hash: vi.fn()
    }
}));


import { fetchUserById, updateUserById, deleteUserById } from "../../../src/repositories/userRepository.js";
import { getUserMe, patchMyProfile, deleteMyProfile } from "../../../src/services/userService.js";
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




