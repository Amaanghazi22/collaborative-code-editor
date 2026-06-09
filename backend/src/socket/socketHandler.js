import { randomUUID } from "crypto";
import { Server } from "socket.io";
import * as Y from "yjs";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";
import { RoomParticipant } from "../models/RoomParticipant.js";
import { RoomDocument } from "../models/RoomDocument.js";
import { RoomMessage } from "../models/RoomMessage.js";
import logger from "../utils/logger.js";

// roomId -> Map<socketId, { userId, username, color }>
const roomPresence = new Map();

// roomId -> Y.Doc
const roomDocs = new Map();

const COLORS = ["#22d3ee", "#a855f7", "#f97316", "#4ade80", "#f43f5e"];
const MAX_CHAT_LENGTH = 500;

/**
 * Returns deduplicated user list from a room's presence map.
 * Keeps the FIRST socket entry found per userId (oldest connection wins color).
 */
function getUniqueUsers(room) {
  const seen = new Set();
  const result = [];
  for (const entry of room.values()) {
    if (!seen.has(entry.userId)) {
      seen.add(entry.userId);
      result.push({ userId: entry.userId, username: entry.username, color: entry.color });
    }
  }
  return result;
}

/**
 * Returns true if the given userId has ANY other socket still present in the room
 * (used to decide whether to emit room:user-left when one tab closes).
 */
function userHasOtherSocket(room, excludeSocketId, userId) {
  for (const [sid, entry] of room.entries()) {
    if (sid !== excludeSocketId && entry.userId === userId) return true;
  }
  return false;
}

/**
 * Returns true if the given userId is already present in the room via any socket.
 * Used to suppress room:user-joined when same user opens a second tab.
 */
function userAlreadyInRoom(room, userId) {
  for (const entry of room.values()) {
    if (entry.userId === userId) return true;
  }
  return false;
}

/**
 * Assign a color to a new connection. Re-use the same color as the user's
 * existing connection if they already have one (consistent color across tabs).
 */
function assignColor(room, userId) {
  for (const entry of room.values()) {
    if (entry.userId === userId) return entry.color;
  }
  // New user — pick next color by unique user count
  const uniqueCount = new Set(Array.from(room.values()).map((e) => e.userId)).size;
  return COLORS[uniqueCount % COLORS.length];
}

async function getOrCreateYDoc(roomId) {
  if (roomDocs.has(roomId)) return roomDocs.get(roomId);

  const doc = new Y.Doc();

  const roomDoc = await RoomDocument.findOne({ where: { room_id: roomId } });
  if (roomDoc?.yjs_state) {
    try {
      Y.applyUpdate(doc, new Uint8Array(roomDoc.yjs_state));
    } catch (err) {
      logger.error(`Corrupt Yjs state for room ${roomId}, falling back to snapshot`, { error: err.message });
      if (roomDoc?.content_snapshot) {
        doc.getText("monaco").insert(0, roomDoc.content_snapshot);
      }
    }
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

  // roomId is stored as a string key in the Map but the DB column is integer —
  // always coerce to avoid silent WHERE-clause misses.
  await RoomDocument.update(
    { yjs_state: Buffer.from(state), content_snapshot: text },
    { where: { room_id: parseInt(roomId, 10) } }
  );
}

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // ── Authentication middleware ──────────────────────────────────────────────
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
    logger.info(`Socket connected: ${socket.user.username}`, { socketId: socket.id });

    // ── JOIN ROOM ────────────────────────────────────────────────────────────
    socket.on("room:join", async ({ roomId }) => {
      // Normalize roomId to string so Map keys are consistent
      const rid = String(roomId);

      try {
        const participant = await RoomParticipant.findOne({
          where: { room_id: rid, user_id: socket.user.id },
        });
        if (!participant) {
          socket.emit("error", { message: "Not a member of this room" });
          return;
        }

        socket.join(`room:${rid}`);
        socket.roomId = rid;

        // Initialise room presence bucket
        if (!roomPresence.has(rid)) roomPresence.set(rid, new Map());
        const room = roomPresence.get(rid);

        // Check before mutating — needed for the joined-event guard below
        const isFirstConnection = !userAlreadyInRoom(room, socket.user.id);

        // Assign color (re-use existing color if user already has another tab)
        const color = assignColor(room, socket.user.id);
        room.set(socket.id, {
          userId: socket.user.id,
          username: socket.user.username,
          color,
        });

        // Send deduplicated user list to the joining socket
        socket.emit("room:users", getUniqueUsers(room));

        // Only notify others if this is the user's FIRST connection to this room.
        // A second tab from the same user should NOT fire room:user-joined again.
        if (isFirstConnection) {
          socket.to(`room:${rid}`).emit("room:user-joined", {
            userId: socket.user.id,
            username: socket.user.username,
            color,
          });
        }

        // Send Yjs document state to the joining socket
        const ydoc = await getOrCreateYDoc(rid);
        const state = Y.encodeStateAsUpdate(ydoc);
        socket.emit("doc:sync", {
          update: Buffer.from(state).toString("base64"),
        });

        logger.info(`${socket.user.username} joined room ${rid}`, {
          roomUniqueUsers: getUniqueUsers(room).length,
          isFirstConnection,
        });
      } catch (err) {
        logger.error("Error joining room", { error: err.message, roomId: rid, userId: socket.user.id });
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ── YJS DOCUMENT UPDATES ─────────────────────────────────────────────────
    socket.on("doc:update", ({ update }) => {
      const rid = socket.roomId;
      if (!rid) return;

      const ydoc = roomDocs.get(rid);
      if (!ydoc) return;

      try {
        const binaryUpdate = Uint8Array.from(Buffer.from(update, "base64"));
        Y.applyUpdate(ydoc, binaryUpdate);
        socket.to(`room:${rid}`).emit("doc:update", { update });
      } catch (err) {
        logger.error("Error applying Y.js update", { error: err.message, roomId: rid });
      }
    });

    // ── CURSOR UPDATES ───────────────────────────────────────────────────────
    socket.on("cursor:move", ({ position, selection }) => {
      const rid = socket.roomId;
      if (!rid) return;

      const room = roomPresence.get(rid);
      const userInfo = room?.get(socket.id);

      socket.to(`room:${rid}`).emit("cursor:update", {
        userId: socket.user.id,
        username: socket.user.username,
        color: userInfo?.color || COLORS[0],
        position,
        selection,
      });
    });

    // ── CHAT MESSAGES ────────────────────────────────────────────────────────
    socket.on("chat:message", ({ content }) => {
      const rid = socket.roomId;
      if (!rid || !content?.trim()) return;

      const trimmed = content.trim();
      if (trimmed.length > MAX_CHAT_LENGTH) {
        socket.emit("error", { message: `Message too long (max ${MAX_CHAT_LENGTH} characters)` });
        return;
      }

      const room = roomPresence.get(rid);
      const userInfo = room?.get(socket.id);
      const color = userInfo?.color || COLORS[0];

      const message = {
        id: randomUUID(),
        userId: socket.user.id,
        username: socket.user.username,
        content: trimmed,
        timestamp: new Date().toISOString(),
        color,
      };

      // Persist fire-and-forget
      RoomMessage.create({
        room_id: rid,
        user_id: socket.user.id,
        username: socket.user.username,
        content: trimmed,
        color,
      }).catch((err) =>
        logger.error("Failed to persist chat message", { error: err.message, roomId: rid })
      );

      // Broadcast to ALL sockets in the room (including sender)
      io.to(`room:${rid}`).emit("chat:message", message);
    });

    // ── LANGUAGE CHANGE ──────────────────────────────────────────────────────
    socket.on("language:change", ({ language }) => {
      const rid = socket.roomId;
      if (!rid) return;
      socket.to(`room:${rid}`).emit("language:change", { language });
    });

    // ── LEAVE ROOM ───────────────────────────────────────────────────────────
    socket.on("room:leave", () => {
      handleLeaveRoom(socket, io);
    });

    // ── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      handleLeaveRoom(socket, io);
      logger.info(`Socket disconnected: ${socket.user.username}`, { socketId: socket.id });
    });
  });

  // Periodic Yjs persistence every 30 seconds
  setInterval(async () => {
    for (const [rid] of roomDocs) {
      try {
        await persistYDoc(rid);
      } catch (err) {
        logger.error(`Failed to persist doc for room ${rid}`, { error: err.message });
      }
    }
  }, 30000);

  return io;
}

async function handleLeaveRoom(socket, io) {
  const rid = socket.roomId;
  if (!rid) return;

  const room = roomPresence.get(rid);
  if (room) {
    // Check BEFORE removing whether the user has another socket still in the room
    const userStillPresent = userHasOtherSocket(room, socket.id, socket.user.id);

    room.delete(socket.id);

    // Only fire room:user-left when the user's LAST connection leaves
    if (!userStillPresent) {
      socket.to(`room:${rid}`).emit("room:user-left", {
        userId: socket.user.id,
        username: socket.user.username,
      });
    }

    // If room is now empty, persist and clean up the Yjs doc
    if (room.size === 0) {
      roomPresence.delete(rid);
      try {
        await persistYDoc(rid);
        const doc = roomDocs.get(rid);
        if (doc) {
          doc.destroy();
          roomDocs.delete(rid);
        }
      } catch (err) {
        logger.error(`Failed to persist doc on last leave for room ${rid}`, { error: err.message });
      }
    }
  }

  socket.leave(`room:${rid}`);
  socket.roomId = null;
}

export { roomPresence };
