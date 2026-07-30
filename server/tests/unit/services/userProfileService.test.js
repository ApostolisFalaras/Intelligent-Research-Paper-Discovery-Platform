import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/repositories/userRepository.js", () => ({
    fetchUserById: vi.fn(),
}));


import { fetchUserById } from "../../../src/repositories/userRepository.js";
import { getUserMe } from "../../../src/services/userService.js";



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
    updated_at: "2026-05-09 16:58:35.442164+03"
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
            createdAt: mockResolvedUser.created_at,
            updatedAt: mockResolvedUser.updated_at 
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





