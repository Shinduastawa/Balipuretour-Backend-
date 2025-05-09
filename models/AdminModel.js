import { Sequelize } from "sequelize";
import db from "../config/Database.js";
// import PackageTour from "./PackgeTour.js";

const { DataTypes } = Sequelize;

const Admin = db.define(
  "admin",
  {
    id_admin: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.ENUM("admin", "user"), // Bisa ditambah sesuai kebutuhan
      allowNull: false,
      defaultValue: "admin", // Default adalah user biasa
    },
    refresh_token: {
      type: DataTypes.TEXT,
    },
    password: {
      type: DataTypes.STRING,
    },
  },
  {
    freezeTableName: true,
  }
);


export default Admin;
