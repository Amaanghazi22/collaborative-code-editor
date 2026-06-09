import express from "express";
import {
  createRoom,
  joinRoom,
  getMyRooms,
  getRoomDetails,
  getRoomMessages,
} from "../controllers/roomController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/my-rooms", authMiddleware, getMyRooms);
// specific sub-routes MUST come before the generic /:roomId catch-all
router.get("/:roomId/messages", authMiddleware, getRoomMessages);
router.get("/:roomId", authMiddleware, getRoomDetails);
router.post("/create", authMiddleware, createRoom);
router.post("/join", authMiddleware, joinRoom);

export { router as roomRoutes };
