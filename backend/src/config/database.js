import { Sequelize } from "sequelize";

/**
 * DATABASE CONNECTION
 *
 * Purpose: Establishes connection to PostgreSQL database
 *
 * Importance:
 * - Central point for all database operations
 * - Connection pooling for performance
 * - Error handling for database failures
 *
 * How it works:
 * 1. Reads database credentials from .env
 * 2. Creates Sequelize instance (ORM)
 * 3. Provides connection object to models
 */

/**
 * Why Connection Pooling?

 * Instead of opening/closing connections for each request (slow)
 * Maintains a pool of reusable connections (fast)
 * Handles multiple users efficiently
 */

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5, // Maximum connections in pool
      min: 0, // Minimum connections
      acquire: 30000, // Max time (ms) to get connection
      idle: 10000, // Max time (ms) connection can be idle
    },
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Unable to connect to database:", error.message);
    process.exit(1);
  }
};

export { sequelize, testConnection };
