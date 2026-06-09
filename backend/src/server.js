import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";

import { sequelize, testConnection } from "./config/database.js";
import { authRoutes } from "./routes/auth.js";
import { roomRoutes } from "./routes/room.js";
import { initializeSocket } from "./socket/socketHandler.js";

// Load all model associations (must run before routes/socket use models)
import "./models/associations.js";

/**
 * SERVER SETUP
 *
 * Purpose: Initialize and start the Express server
 *
 * Importance:
 * - Entry point of application
 * - Configures middleware
 * - Connects database
 * - Defines routes
 * - Starts server
 */

const app = express();
const httpServer = createServer(app);
const io = initializeSocket(httpServer);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Auth Routes
 * 1. signup
 * 2. login
 */
app.use("/api/auth", authRoutes);

/**
 * Room Routes
 * 1. Create room.
 * 2. Join room.
 */
app.use("/api/rooms", roomRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start Server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Create tables if they don't exist — never alters or drops existing tables
    await sequelize.sync({ force: false });

    // Start listening (httpServer instead of app for Socket.io support)
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export { app };
