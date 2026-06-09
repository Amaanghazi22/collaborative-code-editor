import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";
import { RoomParticipant } from "./RoomParticipant.js";

/**
 * ═══════════════════════════════════════════════════════════════
 * ROOM MODEL
 * ═══════════════════════════════════════════════════════════════
 *
 * WHAT IT DOES:
 * - Stores collaborative coding rooms in database
 * - Manages room codes for joining
 * - Tracks room ownership and participants
 *
 * WHY IT'S IMPORTANT:
 * - Every coding session is a "room"
 * - Users share room codes to collaborate
 * - Links to users, files, and chat messages
 *
 * DATABASE FIELDS:
 * - id: Auto-incrementing primary key
 * - name: Room display name (e.g., "React Project")
 * - owner_id: UUID of user who created the room
 * - room_code: 6-character unique code (e.g., "K7M2P9")
 * - is_active: Soft delete flag (true/false)
 * - createdAt: Auto-generated timestamp
 * - updatedAt: Auto-updated timestamp
 * ═══════════════════════════════════════════════════════════════
 */

const Room = sequelize.define(
  "Room",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    room_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "rooms",
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

/**
 * ═══════════════════════════════════════════════════════════════
 * STATIC METHOD: Generate Unique Room Code
 * ═══════════════════════════════════════════════════════════════
 *
 * Creates a random 6-character alphanumeric code
 * Ensures it's unique by checking database
 *
 * RETURNS: String like "K7M2P9"
 *
 * USAGE:
 * const code = await Room.generateRoomCode();
 */
Room.generateRoomCode = async function () {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  const existingRoom = await Room.findOne({
    where: { room_code: code },
  });

  if (existingRoom) {
    return await Room.generateRoomCode();
  }

  return code;
};

/**
 * ═══════════════════════════════════════════════════════════════
 * INSTANCE METHOD: Get Room with Participant Count
 * ═══════════════════════════════════════════════════════════════
 *
 * Returns room data with calculated participant count
 *
 * USAGE:
 * const roomData = await room.withParticipants();
 */
Room.prototype.withParticipants = async function () {
  const participantCount = await RoomParticipant.count({
    where: { room_id: this.id },
  });

  const owner = await User.findByPk(this.owner_id, {
    attributes: ["id", "username", "email"],
  });

  return {
    id: this.id,
    name: this.name,
    room_code: this.room_code,
    owner_id: this.owner_id,
    owner_username: owner?.username || "Unknown",
    is_active: this.is_active,
    participant_count: participantCount,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export { Room };
