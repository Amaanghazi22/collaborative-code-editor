import { User } from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { Op } from "sequelize";

// HTTP Status Codes Used:
//  - 200: Success (login)
//  - 201: Created (signup)
//  - 400: Bad request (validation error)
//  - 401: Unauthorized (wrong password)
//  - 403: Forbidden (account deactivated)
//  - 409: Conflict (user exists)
//  - 500: Server error

/**
 * AUTH CONTROLLER
 *
 * Purpose: Handles authentication business logic
 *
 * Importance:
 * - Core authentication logic
 * - User registration
 * - User login
 * - Token generation
 *
 * This is where the actual work happens!
 */

/**
 * SIGNUP - Register new user
 *
 * Flow:
 * 1. Receive username, email, password
 * 2. Check if user already exists
 * 3. Create user (password auto-hashed by model)
 * 4. Generate JWT token
 * 5. Return token + user data
 */
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Create new user (password will be hashed automatically)
    const user = await User.create({
      username,
      email,
      password,
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * LOGIN - Authenticate existing user
 *
 * Flow:
 * 1. Receive email, password
 * 2. Find user by email
 * 3. Verify password
 * 4. Generate JWT token
 * 5. Return token + user data
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact Support",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export { signup, login };
