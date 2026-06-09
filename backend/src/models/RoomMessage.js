import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const RoomMessage = sequelize.define(
  "RoomMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    tableName: "room_messages",
    timestamps: true,
  }
);

export { RoomMessage };
