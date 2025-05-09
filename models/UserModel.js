import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const User = db.define(
  "user",
  {
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    uid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
    },
    phone_number: {
      type: DataTypes.STRING,
    },
    birth_date: {
      type: DataTypes.DATE,
    },
    gender: {
      type: DataTypes.INTEGER,
    },
    photo_profile: {
      type: DataTypes.STRING, // URL atau path foto profil
    },
    verified: {
      type: DataTypes.BOOLEAN, defaultValue: false
    },
    role: {
      type: DataTypes.ENUM("admin", "user"), // Bisa ditambah sesuai kebutuhan
      allowNull: false,
      defaultValue: "user", // Default adalah user biasa
    },
    refresh_token: {
      type: DataTypes.TEXT,
    },
  },
  {
    freezeTableName: true,
  }
);

export default User;
