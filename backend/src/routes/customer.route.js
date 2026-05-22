import express from "express";

const router = express.Router();

import customerController from "../controllers/customer.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import customerValidation from "../middlewares/customer.validator.js";

router.get(
  "/mechanics/nearby",
  authMiddleware(["customer"]),
  customerValidation.nearbyMechanicsValidation,
  customerController.findNearbyMechanicsController
);

router.post(
  "/problem",
  authMiddleware(["customer"]),
  customerValidation.submitCustomerProblemValidation,
  customerController.createCustomerProblemController
);

// Assign a mechanic to a problem
router.post(
  "/problem/assign-mechanic",
  authMiddleware(["customer"]),
  customerController.assignMechanicController
);

// Update mechanic for a problem
router.patch(
  "/problem/update-mechanic",
  authMiddleware(["customer"]),
  customerController.updateMechanicController
);

// Cancel a problem
router.patch(
  "/problem/cancel",
  authMiddleware(["customer"]),
  customerController.cancelProblemController
);

// Get specific problem details
router.get(
  "/problem/:problemId",
  authMiddleware(["customer"]),
  customerController.getCustomerProblemController
);

export default router;
