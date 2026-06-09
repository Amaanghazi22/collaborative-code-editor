// models/associations.js
import { Room } from "./Room.js";
import { User } from "./User.js";
import { RoomParticipant } from "./RoomParticipant.js";
import { RoomDocument } from "./RoomDocument.js";

/**
 * ═══════════════════════════════════════════════════════════════
 * DEFINE RELATIONSHIPS
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. Room belongs to User (owner)
 * 2. Room has many Users through RoomParticipant (participants)
 * 3. User has many Rooms through RoomParticipant (joined rooms)
 */

// Room owner relationship
Room.belongsTo(User, {
  foreignKey: "owner_id",
  as: "owner",
});

// Many-to-many: Room ↔ Users (participants)
Room.belongsToMany(User, {
  through: RoomParticipant,
  foreignKey: "room_id",
  otherKey: "user_id",
  as: "participants",
});

User.belongsToMany(Room, {
  through: RoomParticipant,
  foreignKey: "user_id",
  otherKey: "room_id",
  as: "joinedRooms",
});

// Room ↔ Document (one-to-one)
Room.hasOne(RoomDocument, { foreignKey: "room_id", as: "document" });
RoomDocument.belongsTo(Room, { foreignKey: "room_id" });

export { Room, User, RoomParticipant, RoomDocument };
