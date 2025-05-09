import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Booking from "./BookingModel.js"; // Import Booking
import Transaction from "./TransactionModel.js"; // Import Transaction

const { DataTypes } = Sequelize;

const Invoice = db.define(
  "invoice", // Nama tabel `invoice` sesuai dengan Sequelize
  {
    id_invoice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    id_booking: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "booking", // Pastikan model Booking sesuai
        key: "id_booking",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    id_transaction: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "transaction", // Pastikan nama tabel `transaction` sesuai
        key: "id_transaction",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    freezeTableName: true,
  }
);

// **📌 Relasi ke Booking & Transaction**
Invoice.belongsTo(Booking, { foreignKey: "id_booking", as: "Booking" });
Invoice.belongsTo(Transaction, { foreignKey: "id_transaction", as: "Transaction" });

export default Invoice;
