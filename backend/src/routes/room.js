import express from "express";
import {
  createRoom,
  joinRoom,
  getMyRooms,
  getRoomDetails,
} from "../controllers/roomController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/my-rooms", authMiddleware, getMyRooms);
router.get("/:roomId", authMiddleware, getRoomDetails);
router.post("/create", authMiddleware, createRoom);
router.post("/join", authMiddleware, joinRoom);

export { router as roomRoutes };
