import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";

/**
 * AUTH MIDDLEWARE
 *
 * Purpose: Protects routes that require authentication
 *
 * Importance:
 * - Guards protected routes
 * - Verifies JWT tokens
 * - Attaches user to request object
 *
 * Used for routes like:
 * - Create room, Join room, Access files, etc.
 */

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Authorization denied.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decode = verifyToken(token);

    const user = await User.findByPk(decode.userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or account deactivated",
      });
    }

    // Attach user to request object (available in next middleware/controller)
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: error.message || "Invalid token",
    });
  }
};

export { authMiddleware };
