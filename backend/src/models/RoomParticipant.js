import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

/**
 * ROOM PARTICIPANTS MODEL
 *
 * Purpose: Represents the many-to-many relationship between rooms and users.
 *
 * Importance:
 * - Keeps track of which users are part of which rooms.
 * - Supports querying participants per room or rooms per user.
 */

const RoomParticipant = sequelize.define(
  "RoomParticipant",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "rooms",
        key: "id",
      },
      comment: "Foreign key to rooms table",
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      comment: "Foreign key to users table",
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: "When user joined this room",
    },
  },
  {
    tableName: "room_participants",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["room_id", "user_id"], // Prevent duplicate entries
        name: "idx_room_user_unique",
      },
      {
        fields: ["user_id"],
        name: "idx_participant_user",
      },
    ],
  }
);

export { RoomParticipant };
