import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/database.js";

/**
 * USER MODEL
 *
 * Purpose: Defines user table structure and authentication methods
 *
 * Importance:
 * - Core entity for authentication
 * - Stores user credentials securely
 * - Provides methods for password operations
 *
 * Security Features:
 * - Passwords are hashed (never stored plain text)
 * - Email validation
 * - Unique constraints
 */

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: "Unique identifier for each user",
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [3, 50],
        isAlphanumeric: true,
      },
      comment: "Unique username for display",
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isEmail: true,
      },
      comment: "User email for login and notifications",
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Hashed password (never plain text)",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Account status (for admin suspension)",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["username"],
      },
      {
        unique: true,
        fields: ["email"],
      },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

/**
 * INSTANCE METHOD: Compare password during login
 *
 * Usage: const isMatch = await user.comparePassword('user_input_password');
 * Returns: true if password matches, false otherwise
 */
User.prototype.comparePassword = async function (candidatePass) {
  return await bcrypt.compare(candidatePass, this.password);
};

/**
 * INSTANCE METHOD: Generate safe user object (no password)
 *
 * Usage: const safeUser = user.toSafeObject();
 * Returns: User object without sensitive data
 */
User.prototype.toSafeObject = function () {
  const { password, ...safeUser } = this.toJSON();
  return safeUser;
};

export { User };
