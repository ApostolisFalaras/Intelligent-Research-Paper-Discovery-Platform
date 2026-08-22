import multer from "multer";
import path from "path";

// Initialize multer file storage
// Where (destination) and under what name (filename) the uploaded file will be stored into
const storage = multer.diskStorage({
	destination: (req, file, callback) => {
		callback(null, "uploads/avatars");
	},

	filename: (req, file, callback) => {
		const extension = path.extname(file.originalname).toLowerCase();

		const filename = `${req.session.userId}-${Date.now()}${extension}`;

		callback(null, filename);
	}
});

// Checks whether the uploaded file is accepted
function fileFilter(req, file, callback) {
	const allowedMimeTypes = ["image/jpeg", "image/png"];

	if (!allowedMimeTypes.includes(file.mimetype)) {
		return callback(new Error("Only JPG and PNG images are accepted"));
	}

	callback(null, true);
}

export const avatarUpload = multer({
	storage, 
	fileFilter, 
	limits: { 
		fileSize: 10 * 1024 * 1024 
	}
}); 