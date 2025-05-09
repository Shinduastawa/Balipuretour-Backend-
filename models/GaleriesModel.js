import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Galeries = db.define(
  "galeries",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_package: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "PackageTour",
        key: "id_package",
      },
    },
    img: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true, // Pastikan tidak menerima string kosong
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
  freezeTableName: true, // agar nama tabel tidak berubah jadi plural
  timestamps: true, // untuk createdAt dan updatedAt otomatis
});




export default Galeries;
