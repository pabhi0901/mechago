import express from "express";
const router = express.Router();

import mechanicController from "../controllers/mechanic.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import mechanicValidation from "../middlewares/mechanic.validator.js";

router.post(
	"/location",
	authMiddleware(["mechanic"]),
	mechanicValidation.storeMechanicLocationValidation,
	mechanicController.createMechanicLocationController
);

router.patch(
	"/location",
	authMiddleware(["mechanic"]),
	mechanicValidation.updateMechanicLocationValidation,
	mechanicController.updateMechanicLocationController
);

// Update status of a problem
router.patch(
  "/problem/status",
  authMiddleware(["mechanic"]),
  mechanicController.updateProblemStatusController
);

// Update fixed price of a problem
router.patch(
  "/problem/fixed-price",
  authMiddleware(["mechanic"]),
  mechanicController.updateFixedPriceController
);

// Update UPI ID of a mechanic
router.patch(
  "/upi-id",
  authMiddleware(["mechanic"]),
  mechanicController.updateUpiIdController
);

// Get messages for a user
router.get(
  "/messages",
  authMiddleware(["mechanic", "customer"]),
  mechanicController.getMessagesController
);

// Get all pending orders for a mechanic
router.get(
  "/orders/pending",
  authMiddleware(["mechanic"]),
  mechanicController.getPendingOrdersController
);

// Get all completed orders for a mechanic
router.get(
  "/orders/completed",
  authMiddleware(["mechanic"]),
  mechanicController.getCompletedOrdersController
);

export default router;