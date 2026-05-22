import express from "express";
const router = express.Router();

import authController from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authValidation from "../middlewares/auth.validator.js";


router.post("/register", authValidation.registerValidation, authController.registerController)
router.post("/login", authValidation.loginValidation, authController.loginController)
router.post("/logout", authMiddleware(["customer", "mechanic", "admin"]), authController.logoutController)
router.patch("/change-profile-photo", authMiddleware(["customer", "mechanic", "admin"]), authValidation.changeProfilePhotoValidation, authController.changeProfilePhotoController)
router.patch("/change-password", authMiddleware(["customer", "mechanic", "admin"]), authController.changePasswordController)



export default router;