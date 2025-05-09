import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Invoice from "./InvoiceModel.js"; // Import relasi

const { DataTypes } = Sequelize;

const InvoiceDetail = db.define(
  "invoice_detail",
  {
    id_detail: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    id_invoice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Invoice",
        key: "id_invoice",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  }
);

// // Relasi: InvoiceDetail milik satu Invoice
// InvoiceDetail.belongsTo(Invoice, {
//   foreignKey: "id_invoice",
//   as: "invoice",
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE",
// });

export default InvoiceDetail;
