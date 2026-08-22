import fs from "fs/promises";
import path from "path";
import { fetchUserById } from "./../repositories/userRepository.js";
import { patchMyProfile } from "./userService.js";
import { parseUserId } from "./../utils/parseData.js";
import { AppError } from "./../utils/AppError.js";

export async function removeUserAvatar(userId) {
	// Validate user Id
	const parsedUserId = parseUserId(userId);

	const user = await fetchUserById(parsedUserId);
	if (!user) {
		throw new AppError("User not found", 404);
	}

	const avatarURL = user.avatar_url;

	if (!avatarURL) {
		// No avatar URL to remove, but clearing it again
		await patchMyProfile(parsedUserId, { avatarURL: null });
		return;
	}

	// Validate prefix
	const prefix = "/uploads/avatars/";
	if (!avatarURL.startsWith(prefix)) {
		throw new AppError("Invalid avatar path", 500);
	}

	const filename = path.basename(avatarURL);
	const avatarDirectory = path.resolve("uploads", "avatars");
	const filePath = path.resolve(avatarDirectory, filename);

	if (!filePath.startsWith(avatarDirectory + path.sep)) {
		throw new AppError("Invalid avatar path", 500);
	}

	try {
		await fs.unlink(filePath);
	} catch (error) {
		// EOENT -> DB referenced a file that's already gone
		if (error.code !== "ENOENT") {
			throw error;
		}
	}

	await patchMyProfile(parsedUserId, { avatarURL: null });
}