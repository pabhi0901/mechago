import multer from "multer";
import { body, query, validationResult } from "express-validator";

const upload = multer({ storage: multer.memoryStorage() });

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array()
    });
  }

  next();
};

export const nearbyMechanicsValidation = [
  query("longitude")
    .exists()
    .withMessage("longitude is required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("longitude must be between -180 and 180")
    .toFloat(),
  query("latitude")
    .exists()
    .withMessage("latitude is required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("latitude must be between -90 and 90")
    .toFloat(),
  query("radiusKm")
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage("radiusKm must be between 0.1 and 100")
    .toFloat(),
  handleValidationErrors
];

export const submitCustomerProblemValidation = [
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "photos", maxCount: 2 }
  ]),
  body("mechanicId")
    .trim()
    .notEmpty()
    .withMessage("mechanicId is required")
    .isMongoId()
    .withMessage("mechanicId must be a valid MongoDB id"),
  body("vehicleType")
    .trim()
    .notEmpty()
    .withMessage("vehicleType is required")
    .isIn(["bike", "scooter", "car", "auto", "truck", "bus", "e-rickshaw", "other"])
    .withMessage("Invalid vehicleType"),
  body("problemType")
    .trim()
    .notEmpty()
    .withMessage("problemType is required")
    .isIn([
      "puncture",
      "battery_discharge",
      "engine_failure",
      "fuel_empty",
      "overheating",
      "brake_issue",
      "starter_issue",
      "electrical_issue",
      "accident",
      "clutch_issue",
      "chain_issue",
      "towing_required",
      "other"
    ])
    .withMessage("Invalid problemType"),
  body("address")
    .trim()
    .notEmpty()
    .withMessage("address is required"),
  body("latitude")
    .exists()
    .withMessage("latitude is required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("latitude must be between -90 and 90")
    .toFloat(),
  body("longitude")
    .exists()
    .withMessage("longitude is required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("longitude must be between -180 and 180")
    .toFloat(),
  body("additionalNotes").optional().trim(),
  body("video").optional().trim(),
  body("photos").optional(),
  handleValidationErrors
];

export default {
  nearbyMechanicsValidation,
  submitCustomerProblemValidation
};
