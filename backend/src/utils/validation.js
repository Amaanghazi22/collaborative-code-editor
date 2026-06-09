import { body, validationResult } from "express-validator";

/**
 * VALIDATION MIDDLEWARE
 *
 * Purpose: Validate user input before processing
 *
 * Importance:
 * - Prevents SQL injection
 * - Ensures data integrity
 * - Provides clear error messages
 * - Stops invalid data early
 */

/**
 * Signup Validation Rules
 */
const signupValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be 3-50 characters")
    .isAlphanumeric()
    .withMessage("Username can only contain letters and numbers"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
];

/**
 * Login Validation Rules
 */
const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Validation Error Handler
 *
 * Checks if validation failed and returns errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

export { signupValidation, loginValidation, validate };
