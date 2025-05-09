import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PackageTour from "./PackgeTourModel.js"; // Import PackageTour

const { DataTypes } = Sequelize;

const Rundown = db.define(
  "rundown",
  {
    id_package: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "PackageTour",
        key: "id_package",
      },
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  }
);

// Relasi dengan PackageTour
Rundown.belongsTo(PackageTour, { foreignKey: "id_package", as: "Package" });
PackageTour.hasMany(Rundown, { foreignKey: "id_package", as: "Rundown", onDelete: 'CASCADE' });

export default Rundown;
