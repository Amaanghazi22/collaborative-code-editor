import { Server } from "socket.io";
import * as Y from "yjs";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";
import { RoomParticipant } from "../models/RoomParticipant.js";
import { RoomDocument } from "../models/RoomDocument.js";

// In-memory presence map: roomId -> Map<socketId, { userId, username, color }>
const roomPresence = new Map();

// In-memory Y.js documents: roomId -> Y.Doc
const roomDocs = new Map();

const COLORS = ["#22d3ee", "#a855f7", "#f97316", "#4ade80", "#f43f5e"];

async function getOrCreateYDoc(roomId) {
  if (roomDocs.has(roomId)) return roomDocs.get(roomId);

  const doc = new Y.Doc();

  // Load persisted state from database
  const roomDoc = await RoomDocument.findOne({ where: { room_id: roomId } });
  if (roomDoc?.yjs_state) {
    Y.applyUpdate(doc, new Uint8Array(roomDoc.yjs_state));
  } else if (roomDoc?.content_snapshot) {
    doc.getText("monaco").insert(0, roomDoc.content_snapshot);
  }

  roomDocs.set(roomId, doc);
  return doc;
}

async function persistYDoc(roomId) {
  const doc = roomDocs.get(roomId);
  if (!doc) return;

  const state = Y.encodeStateAsUpdate(doc);
  const text = doc.getText("monaco").toString();

  await RoomDocument.update(
    {
      yjs_state: Buffer.from(state),
      content_snapshot: text,
    },
    { where: { room_id: parseInt(roomId) } }
  );
}

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ["password"] },
      });

      if (!user || !user.isActive) return next(new Error("User not found"));

      socket.user = { id: user.id, username: user.username, email: user.email };
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // JOIN ROOM
    socket.on("room:join", async ({ roomId }) => {
      try {
        const participant = await RoomParticipant.findOne({
          where: { room_id: roomId, user_id: socket.user.id },
        });
        if (!participant) {
          socket.emit("error", { message: "Not a member of this room" });
          return;
        }

        socket.join(`room:${roomId}`);
        socket.roomId = roomId;

        // Add to presence map
        if (!roomPresence.has(roomId)) roomPresence.set(roomId, new Map());
        const room = roomPresence.get(roomId);
        const colorIndex = room.size % COLORS.length;
        room.set(socket.id, {
          userId: socket.user.id,
          username: socket.user.username,
          color: COLORS[colorIndex],
        });

        // Send current user list to the joining user
        const users = Array.from(room.values());
        socket.emit("room:users", users);

        // Notify others
        socket.to(`room:${roomId}`).emit("room:user-joined", {
          userId: socket.user.id,
          username: socket.user.username,
          color: COLORS[colorIndex],
        });

        // Send Y.js document state to the joining user
        const ydoc = await getOrCreateYDoc(roomId);
        const state = Y.encodeStateAsUpdate(ydoc);
        socket.emit("doc:sync", {
          update: Buffer.from(state).toString("base64"),
        });

        console.log(
          `${socket.user.username} joined room ${roomId} (${room.size} users)`
        );
      } catch (err) {
        console.error("Error joining room:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Y.JS DOCUMENT UPDATES
    socket.on("doc:update", ({ update }) => {
      const roomId = socket.roomId;
      if (!roomId) return;

      const ydoc = roomDocs.get(roomId);
      if (!ydoc) return;

      try {
        const binaryUpdate = Uint8Array.from(Buffer.from(update, "base64"));
        Y.applyUpdate(ydoc, binaryUpdate);

        // Broadcast to all OTHER clients in the room
        socket.to(`room:${roomId}`).emit("doc:update", { update });
      } catch (err) {
        console.error("Error applying Y.js update:", err);
      }
    });

    // CURSOR UPDATES
    socket.on("cursor:move", ({ position, selection }) => {
      const roomId = socket.roomId;
      if (!roomId) return;

      const room = roomPresence.get(roomId);
      const userInfo = room?.get(socket.id);

      socket.to(`room:${roomId}`).emit("cursor:update", {
        userId: socket.user.id,
        username: socket.user.username,
        color: userInfo?.color || COLORS[0],
        position,
        selection,
      });
    });

    // CHAT MESSAGES
    socket.on("chat:message", ({ content }) => {
      const roomId = socket.roomId;
      if (!roomId || !content?.trim()) return;

      const room = roomPresence.get(roomId);
      const userInfo = room?.get(socket.id);

      const message = {
        id: `${Date.now()}-${socket.user.id}`,
        userId: socket.user.id,
        username: socket.user.username,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        color: userInfo?.color || COLORS[0],
      };

      // Send to ALL users in the room (including sender)
      io.to(`room:${roomId}`).emit("chat:message", message);
    });

    // LANGUAGE CHANGE
    socket.on("language:change", ({ language }) => {
      const roomId = socket.roomId;
      if (!roomId) return;

      socket.to(`room:${roomId}`).emit("language:change", { language });
    });

    // LEAVE ROOM
    socket.on("room:leave", () => {
      handleLeaveRoom(socket, io);
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      handleLeaveRoom(socket, io);
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });

  // Periodic persistence: save active Y.js docs every 30 seconds
  setInterval(async () => {
    for (const [roomId] of roomDocs) {
      try {
        await persistYDoc(roomId);
      } catch (err) {
        console.error(`Failed to persist doc for room ${roomId}:`, err);
      }
    }
  }, 30000);

  return io;
}

async function handleLeaveRoom(socket, io) {
  const roomId = socket.roomId;
  if (!roomId) return;

  const room = roomPresence.get(roomId);
  if (room) {
    room.delete(socket.id);

    // If last user left, persist and clean up the Y.js doc
    if (room.size === 0) {
      roomPresence.delete(roomId);
      try {
        await persistYDoc(roomId);
        const doc = roomDocs.get(roomId);
        if (doc) {
          doc.destroy();
          roomDocs.delete(roomId);
        }
      } catch (err) {
        console.error(`Failed to persist doc on last leave for room ${roomId}:`, err);
      }
    }
  }

  socket.to(`room:${roomId}`).emit("room:user-left", {
    userId: socket.user.id,
    username: socket.user.username,
  });

  socket.leave(`room:${roomId}`);
  socket.roomId = null;
}

export { roomPresence };
