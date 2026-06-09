import { Room } from "../models/Room.js";
import { RoomParticipant } from "../models/RoomParticipant.js";
import { User } from "../models/User.js";
import { RoomDocument } from "../models/RoomDocument.js";
import { RoomMessage } from "../models/RoomMessage.js";

/**
 * HTTP STATUS CODES:
 * - 200: Success (joined existing room)
 * - 201: Created (new room created)
 * - 400: Bad request (validation error)
 * - 404: Not found (room doesn't exist)
 * - 409: Conflict (already in room)
 * - 500: Server error
 */

/**
 * Creates a new collaborative coding room and adds the user as a participant.
 *
 * @accepts
 * - req.body.name {string} — Name of the room
 *
 * @returns
 * - 201 — Room created successfully
 * - 400 / 404 — Invalid or missing room name
 * - 500 — Failed to create room
 */
const createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length === 0) {
      return res.status(404).json({
        success: false,
        message: "Room name is required",
      });
    }

    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Room name must be between 3 to 100 characters",
      });
    }

    const roomCode = await Room.generateRoomCode();

    const room = await Room.create({
      name: name.trim(),
      owner_id: userId,
      room_code: roomCode,
      is_active: true,
    });

    await RoomParticipant.create({
      room_id: room.id,
      user_id: userId,
    });

    // Create the shared document for this room
    await RoomDocument.create({ room_id: room.id });

    const roomWithDetails = await room.withParticipants();

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: {
        room: roomWithDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create room",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;
    const userId = req.user.id;

    if (!roomCode || typeof roomCode !== "string") {
      return res.status(400).json({
        success: false,
        message: "Room code is required",
      });
    }

    // Validate format: 6 alphanumeric characters
    const codeRegex = /^[A-Z0-9]{6}$/i;
    if (!codeRegex.test(roomCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room code format. Must be 6 alphanumeric characters.",
      });
    }

    const room = await Room.findOne({
      where: {
        room_code: roomCode.toUpperCase(), // created by only uppercase and 0-9.
        is_active: true,
      },
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found. Please check the code and try again",
      });
    }

    const existingParticipant = await RoomParticipant.findOne({
      where: {
        room_id: room.id,
        user_id: userId,
      },
    });

    if (existingParticipant) {
      const roomWithDetails = await room.withParticipants();

      return res.status(200).json({
        success: true,
        message: "You are already a member of this room",
        data: {
          room: roomWithDetails,
        },
      });
    }

    await RoomParticipant.create({
      room_id: room.id,
      user_id: userId,
    });

    const roomWithDetails = await room.withParticipants();

    res.status(200).json({
      success: true,
      message: "Joined room successfully",
      data: {
        room: roomWithDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to join room",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getMyRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const participantEntries = await RoomParticipant.findAll({
      where: { user_id: userId },
      attributes: ["room_id"],
    });

    const roomIds = participantEntries.map((p) => p.room_id);

    if (roomIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { rooms: [] },
      });
    }

    const rooms = await Room.findAll({
      where: { id: roomIds, is_active: true },
      order: [["updatedAt", "DESC"]],
    });

    const roomsWithDetails = await Promise.all(
      rooms.map((room) => room.withParticipants())
    );

    res.status(200).json({
      success: true,
      data: { rooms: roomsWithDetails },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findByPk(roomId);

    if (!room || !room.is_active) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const isParticipant = await RoomParticipant.findOne({
      where: { room_id: roomId, user_id: userId },
    });

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this room",
      });
    }

    const roomWithDetails = await room.withParticipants();
    res.status(200).json({
      success: true,
      data: { room: roomWithDetails },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get room details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const isParticipant = await RoomParticipant.findOne({
      where: { room_id: roomId, user_id: userId },
    });

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Not a member of this room" });
    }

    const messages = await RoomMessage.findAll({
      where: { room_id: roomId },
      order: [["createdAt", "ASC"]],
      limit: 100,
    });

    const formatted = messages.map((m) => ({
      id: m.id.toString(),
      userId: m.user_id,
      username: m.username,
      content: m.content,
      timestamp: m.createdAt.toISOString(),
      color: m.color,
    }));

    res.status(200).json({ success: true, data: { messages: formatted } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export { createRoom, joinRoom, getMyRooms, getRoomDetails, getRoomMessages };
