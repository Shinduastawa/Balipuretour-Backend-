import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Galeries from "./GaleriesModel.js";

const { DataTypes } = Sequelize;

const PackageTour = db.define(
  "packageTour",
  {
    id_package: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    package_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    about_package: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    program_tour: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // Harga dalam USD
    price_usd_2_5_person: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    price_usd_6_10_person: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    price_usd_11_15_person: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    price_usd_16_20_person: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    price_usd_21_person_up: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    // Harga dalam IDR
    price_idr_2_5_person: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_idr_6_10_person: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_idr_11_15_person: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_idr_16_20_person: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_idr_21_person_up: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    facility_tour: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    contact_pt: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    tableName: 'packagetour'
  }
);

// Relasi One-to-Many antara PackageTour dan Galeries
PackageTour.hasMany(Galeries, {
  foreignKey: "id_package",
  as: "Galeries",
  onDelete: "CASCADE",
});
Galeries.belongsTo(PackageTour, {
  foreignKey: "id_package",
  as: "Package",
});

export default PackageTour;
