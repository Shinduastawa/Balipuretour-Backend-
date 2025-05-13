// models/InboxModel.js
import { DataTypes } from "sequelize";
import db from "../config/Database.js";

const Inbox = db.define(
  "Inbox",
  {
    type: {
      type: DataTypes.ENUM("user_login", "booking_full", "new_booking", "payment_success"),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    freezeTableName: true,
    tableName: "inboxes",
  }
);

export default Inbox;
