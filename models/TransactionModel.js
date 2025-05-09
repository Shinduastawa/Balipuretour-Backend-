import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Booking from "./BookingModel.js"; // Import Booking

const { DataTypes } = Sequelize;

const Transaction = db.define(
  "transaction",
  {
    id_transaction: {
      type: DataTypes.STRING, // ✅ Ubah ke STRING agar bisa simpan `order_id`
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // ✅ Pastikan order_id unik
    },
    id_booking: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Booking",
        key: "id_booking",
      },
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    total_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
      allowNull: false,
    },
    transaction_date: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    package_name: {
      type: DataTypes.STRING, // ✅ Tambahkan nama paket
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payment_numbers: {
      type: DataTypes.INTEGER, // ✅ Tambahkan jumlah peserta
      allowNull: true,
    },
    num_participants: {
      type: DataTypes.INTEGER, // ✅ Tambahkan jumlah peserta
      allowNull: false,
    },
    checkin_date: {
      type: DataTypes.DATE, // ✅ Tambahkan tanggal check-in
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
  }
);

// Relasi dengan Booking
Transaction.belongsTo(Booking, { foreignKey: "id_booking", as: "Booking" });
Booking.hasOne(Transaction, { foreignKey: "id_booking", as: "Transaction", onDelete: 'CASCADE' });

export default Transaction;
