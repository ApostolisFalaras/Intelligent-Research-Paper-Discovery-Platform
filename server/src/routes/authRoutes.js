import express from "express";
import { loginController, registerController, logoutController } from "./../controllers/authController.js";

const router = express.Router();

// User submits their credentials for validation
router.post("/login", loginController);

// User registers in the app
router.post("/register", registerController);

// User logs out of their current session
router.post("/logout", logoutController);

export default router;