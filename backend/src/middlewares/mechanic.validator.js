import { body, validationResult } from "express-validator";

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

const coordinateValidations = [
  body("longitude")
    .exists()
    .withMessage("longitude is required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("longitude must be between -180 and 180")
    .toFloat(),
  body("latitude")
    .exists()
    .withMessage("latitude is required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("latitude must be between -90 and 90")
    .toFloat(),
  handleValidationErrors
];

export const storeMechanicLocationValidation = coordinateValidations;
export const updateMechanicLocationValidation = coordinateValidations;

export default {
  storeMechanicLocationValidation,
  updateMechanicLocationValidation
};
