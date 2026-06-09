import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

/**
 * JWT TOKEN UTILITIES
 *
 * Purpose: Generate and verify JWT tokens for authentication
 *
 * Importance:
 * - Stateless authentication (no server-side sessions)
 * - Secure token generation
 * - Token verification for protected routes
 *
 * How JWT works:
 * 1. User logs in → Server generates token → Sends to client
 * 2. Client stores token (localStorage/cookie)
 * 3. Client sends token with every request
 * 4. Server verifies token → Allows/denies access
 */

/**
 * Generate JWT Token
 *
 * @param {Object} payload - Data to encode in token (user id, email, etc.)
 * @returns {String} - Signed JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
    issuer: "collab-code",
  });
};

/**
 * Verify JWT Token
 *
 * @param {String} token - JWT token from request header
 * @returns {Object} - Decoded payload if valid
 * @throws {Error} - If token is invalid/expired
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid Token");
    }
    throw error;
  }
};

export { generateToken, verifyToken };
