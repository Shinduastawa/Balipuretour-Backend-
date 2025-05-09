import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PackageTour from "./PackgeTourModel.js"; // Import model PackageTour

const { DataTypes } = Sequelize;

const CardDestination = db.define(
  "card_destination",
  {
    id_package: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "PackageTour",
        key: "id_package",
      },
    },
    card_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    about_card: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    note_card: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  }
);

// Relasi dengan PackageTour
CardDestination.belongsTo(PackageTour, { foreignKey: "id_package", as: "Package" });
PackageTour.hasOne(CardDestination, { foreignKey: "id_package", as: "CardDestination" });

export default CardDestination;
