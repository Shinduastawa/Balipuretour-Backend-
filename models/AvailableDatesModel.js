import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PackageTour from "./PackgeTourModel.js"; // Pastikan ini diimpor dengan benar

const { DataTypes } = Sequelize;

const AvailableDates = db.define(
  "availableDates",
  {
    id_date: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    id_package: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PackageTour, // Referensi mengarah ke model, bukan tabel
        key: "id_package",
      },
      onDelete: "CASCADE",
    },
    available_date: {
      type: DataTypes.DATEONLY, // Format hanya tanggal (YYYY-MM-DD)
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("available", "booked"),
      defaultValue: "available", // Default status "available"
    },
  },
  {
    freezeTableName: true,
    tableName: 'availabledates' // ← Ini wajib di-set
  }
);

// Relasi One-to-Many antara PackageTour dan AvailableDates
PackageTour.hasMany(AvailableDates, {
  foreignKey: "id_package",
  as: "AvailableDates",
  onDelete: "CASCADE",
});
AvailableDates.belongsTo(PackageTour, {
  foreignKey: "id_package",
  as: "Package",
});

export default AvailableDates;
