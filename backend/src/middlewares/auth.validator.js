import multer from "multer";
import { body, validationResult } from "express-validator";

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

export const registerValidation = [
  upload.single("image"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone must be between 10 and 15 digits"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is invalid"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["customer", "mechanic", "admin"])
    .withMessage("Role must be customer, mechanic, or admin"),
  body("upiId")
    .if(body("role").equals("mechanic"))
    .trim()
    .notEmpty()
    .withMessage("upiId is required for mechanic registration"),
  body("upiName")
    .if(body("role").equals("mechanic"))
    .trim()
    .notEmpty()
    .withMessage("upiName is required for mechanic registration"),
  handleValidationErrors
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is invalid"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required"),
  body("role")
    .optional()
    .isIn(["customer", "mechanic", "admin"])
    .withMessage("Role must be customer, mechanic, or admin"),
  handleValidationErrors
];

export const changeProfilePhotoValidation = [
  upload.single("image"),
  handleValidationErrors
];

export default {
  registerValidation,
  loginValidation,
  changeProfilePhotoValidation
};