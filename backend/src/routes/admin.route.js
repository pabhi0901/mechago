import express from "express";

const router = express.Router();

import adminController from "../controllers/admin.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

router.get("/mechanics", authMiddleware(["admin"]), adminController.getAllMechanicsController);
router.get("/mechanics/pending", authMiddleware(["admin"]), adminController.getPendingMechanicRequestsController);
router.patch("/toggle-verification/:mechanicId", authMiddleware(["admin"]), adminController.toggleAdminVerificationController);

export default router;