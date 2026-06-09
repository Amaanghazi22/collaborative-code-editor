import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const RoomDocument = sequelize.define(
  "RoomDocument",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "rooms",
        key: "id",
      },
    },
    yjs_state: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    content_snapshot: {
      type: DataTypes.TEXT,
      defaultValue: "// Start coding here...\n",
    },
    language: {
      type: DataTypes.STRING(50),
      defaultValue: "javascript",
    },
  },
  {
    tableName: "room_documents",
    timestamps: true,
  }
);

export { RoomDocument };
