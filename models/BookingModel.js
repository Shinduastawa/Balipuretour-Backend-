import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PackageTour from "./PackgeTourModel.js";
import User from "./UserModel.js";
import AvailableDate from "./AvailableDatesModel.js"; // Import model available_dates

const { DataTypes } = Sequelize;

const Booking = db.define(
  "booking",
  {
    id_booking: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_package: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PackageTour,
        key: "id_package",
      },
    },
    package_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    num_participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    checkin_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    price_idr: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "canceled"),
      defaultValue: "pending",
    },
    cancel_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    id_date: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: AvailableDate,
        key: "id_date",
      },
    },
  },
  {
    freezeTableName: true,
    tableName: "booking",
  }
);

// === RELASI ===
Booking.belongsTo(User, { foreignKey: "user_id", as: "User" });
User.hasMany(Booking, { foreignKey: "user_id", as: "Bookings", onDelete: "CASCADE" });

Booking.belongsTo(PackageTour, { foreignKey: "id_package", as: "Package" });
PackageTour.hasMany(Booking, { foreignKey: "id_package", as: "Bookings", onDelete: "CASCADE" });

Booking.belongsTo(AvailableDate, { foreignKey: "id_date", as: "AvailableDate" });
AvailableDate.hasMany(Booking, { foreignKey: "id_date", as: "Bookings" });

export default Booking;
