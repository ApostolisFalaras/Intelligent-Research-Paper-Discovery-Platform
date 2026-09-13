import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/repositories/userRepository.js", () => ({
    fetchUserById: vi.fn()
}));

vi.mock("../../../src/services/userService.js", () => ({
    patchMyProfile: vi.fn()
}));

vi.mock("fs/promises", () => ({
    default: {
        unlink: vi.fn()
    }
}));


import fs from "fs/promises";
import { fetchUserById } from "../../../src/repositories/userRepository.js";
import { patchMyProfile } from "../../../src/services/userService.js";
import { removeUserAvatar } from "../../../src/services/avatarService.js";

describe("removeUserAvatar", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// ---------- SUCCESSFUL CASES ----------

	it("Clears the avatar URL when the user has no stored avatar", async () => {
		// Not mocking all user fields for simplicity
		fetchUserById.mockResolvedValue({ id: 42, avatar_url: null });
		patchMyProfile.mockResolvedValue(undefined);

		await removeUserAvatar(42);

		expect(fetchUserById).toHaveBeenCalledWith(42);
		expect(fetchUserById).toHaveBeenCalledTimes(1);
		
		expect(fs.unlink).not.toHaveBeenCalled();

		expect(patchMyProfile).toHaveBeenCalledWith(42, { avatarURL: null });
        expect(patchMyProfile).toHaveBeenCalledTimes(1);
	});

	it("Deletes the existing avatar file and clears the avatar URL", async () => {
        fetchUserById.mockResolvedValue({
            id: 42,
            avatar_url: "/uploads/avatars/42-avatar.png"
        });

        fs.unlink.mockResolvedValue(undefined);
        patchMyProfile.mockResolvedValue(undefined);

        await removeUserAvatar(42);

        expect(fetchUserById).toHaveBeenCalledWith(42);
		expect(fetchUserById).toHaveBeenCalledTimes(1);

        expect(fs.unlink).toHaveBeenCalledTimes(1);

        expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining("42-avatar.png"));

        expect(patchMyProfile).toHaveBeenCalledWith(42, { avatarURL: null });
        expect(patchMyProfile).toHaveBeenCalledTimes(1);
    });

	it("Still clears the avatar URL when the referenced avatar file no longer exists", async () => {
        fetchUserById.mockResolvedValue({
            id: 42,
            avatar_url: "/uploads/avatars/42-avatar.png"
        });

        const error = new Error("File not found");
        error.code = "ENOENT";

        fs.unlink.mockRejectedValue(error);
        patchMyProfile.mockResolvedValue(undefined);

        await removeUserAvatar(42);

        expect(fs.unlink).toHaveBeenCalledTimes(1);

        expect(patchMyProfile).toHaveBeenCalledWith(42, { avatarURL: null });
    });

	// ---------- ERROR CASES ----------

	it("Throws 400 when the user id is invalid", async () => {
        await expect(removeUserAvatar("42")).rejects.toThrow("Missing/Invalid user_id");

        expect(fetchUserById).not.toHaveBeenCalled();
        expect(fs.unlink).not.toHaveBeenCalled();
        expect(patchMyProfile).not.toHaveBeenCalled();
    });

	it("Throws 404 when the user does not exist", async () => {
        fetchUserById.mockResolvedValue(null);

        await expect(removeUserAvatar(42)).rejects.toThrow("User not found");

        expect(fetchUserById).toHaveBeenCalledWith(42);

        expect(fs.unlink).not.toHaveBeenCalled();
        expect(patchMyProfile).not.toHaveBeenCalled();
    });


    it("Throws 500 when the stored avatar URL has an invalid prefix", async () => {
        fetchUserById.mockResolvedValue({
            id: 42,
            avatar_url: "/images/avatar.png"
        });

        await expect(removeUserAvatar(42)).rejects.toThrow("Invalid avatar path");

        expect(fs.unlink).not.toHaveBeenCalled();
        expect(patchMyProfile).not.toHaveBeenCalled();
    });

    // ---------- PROPAGATED ERRORS ----------

    it("Propagates filesystem errors other than ENOENT", async () => {
        fetchUserById.mockResolvedValue({
            id: 42,
            avatar_url: "/uploads/avatars/42-avatar.png"
        });

        const error = new Error("Permission denied");
        error.code = "EACCES";

        fs.unlink.mockRejectedValue(error);

        await expect(removeUserAvatar(42)).rejects.toThrow("Permission denied");

        expect(fs.unlink).toHaveBeenCalledTimes(1);

        expect(patchMyProfile).not.toHaveBeenCalled();
    });


    it("Propagates repository errors while fetching the user", async () => {
        fetchUserById.mockRejectedValue(new Error("Database query failed"));

        await expect(removeUserAvatar(42)).rejects.toThrow("Database query failed");

        expect(fetchUserById).toHaveBeenCalledWith(42);
		expect(fetchUserById).toHaveBeenCalledTimes(1);

        expect(fs.unlink).not.toHaveBeenCalled();
        expect(patchMyProfile).not.toHaveBeenCalled();
    });


    it("Propagates profile update errors after deleting the avatar", async () => {
        fetchUserById.mockResolvedValue({
            id: 42,
            avatar_url: "/uploads/avatars/42-avatar.png"
        });

        fs.unlink.mockResolvedValue(undefined);

        patchMyProfile.mockRejectedValue(new Error("Database query failed"));

        await expect(removeUserAvatar(42)).rejects.toThrow("Database query failed");

        expect(fs.unlink).toHaveBeenCalledTimes(1);

        expect(patchMyProfile).toHaveBeenCalledWith(42, { avatarURL: null });
		expect(patchMyProfile).toHaveBeenCalledTimes(1);
    });
});