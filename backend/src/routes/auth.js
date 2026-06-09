import express from "express";
import { signup, login } from "../controllers/authController.js";
import {
  signupValidation,
  loginValidation,
  validate,
} from "../utils/validation.js";

const router = express.Router();

/**
 * AUTH ROUTES
 *
 * Purpose: Define API endpoints for authentication
 *
 * Importance:
 * - Maps URLs to controllers
 * - Applies middleware in order
 * - Organizes API structure
 */

/**
 * POST /api/auth/signup
 *
 * Request body:
 * {
 *   "username": "johndoe",
 *   "email": "john@example.com",
 *   "password": "SecurePass123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIs...",
 *     "user": { "id": "...", "username": "johndoe", "email": "..." }
 *   }
 * }
 */

// signupValidation → validate → signup
//      (1)              (2)       (3)

//  - 1. Check input format
//  - 2. Return errors if invalid
//  - 3. Process signup if valid
router.post("/signup", signupValidation, validate, signup);

/**
 * POST /api/auth/login
 *
 * Request body:
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIs...",
 *     "user": { "id": "...", "username": "johndoe", "email": "..." }
 *   }
 * }
 */
router.post("/login", loginValidation, validate, login);

export { router as authRoutes };
