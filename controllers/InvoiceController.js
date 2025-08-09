import Invoice from "../models/InvoiceModel.js"; // Import Model Invoice
import nodemailer from "nodemailer"; // Import nodemailer untuk mengirim email
import Transaction from '../models/TransactionModel.js';
import Booking from '../models/BookingModel.js';
import dotenv from 'dotenv'; // Import dotenv untuk mengatur variabel lingkungan
dotenv.config(); // Memuat variabel lingkungan dari file .env
import logger from "../utils/logger.js";

// **📌 Membuat Invoice Baru dan Mengirim Email Konfirmasi**
export const createInvoice = async (req, res) => {
  const { id_booking, id_transaction, invoice_number, total_amount, due_date, description, quantity, unit_price, subtotal, status, email } = req.body;

  try {
    // Membuat invoice baru
    const newInvoice = await Invoice.create({
      id_booking,
      id_transaction,
      invoice_number,
      total_amount,
      due_date,
      description,
      quantity,
      unit_price,
      subtotal,
      status,
    });

    // Mengubah status transaksi menjadi "paid"
    await Transaction.update(
      { payment_status: "paid" },
      { where: { id_transaction } }
    );

    // Mengirim email konfirmasi kepada pemesan
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Payment Confirmation",
      text: `Dear customer, your payment has been successfully processed. Your booking with ID: ${id_booking} is now confirmed. Invoice Number: ${invoice_number}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
       logger.info("❌ Email failed to send:", error);
      } else {
       logger.info("✅ Email sent:", info.response);
      }
    });

    return res.status(201).json({
      message: "Invoice berhasil dibuat dan email konfirmasi dikirim!",
      data: newInvoice,
    });
  } catch (error) {
   logger.error("❌ Error creating invoice:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat membuat invoice dan mengirim email",
      error: error.message,
    });
  }
};

// **📌 Mengambil Semua Invoice**
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        { model: Booking, as: "Booking" },
        { model: Transaction, as: "Transaction" },
      ],
    });

    return res.status(200).json({
      message: "Daftar Invoice berhasil diambil",
      data: invoices,
    });
  } catch (error) {
   logger.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data invoice",
      error: error.message,
    });
  }
};

// **📌 Mengambil Invoice berdasarkan ID**
export const getInvoiceById = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await Invoice.findOne({
      where: { id_invoice: id },
      include: [
        { model: Booking, as: "Booking" },
        { model: Transaction, as: "Transaction" },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Invoice berhasil diambil",
      data: invoice,
    });
  } catch (error) {
   logger.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data invoice",
      error: error.message,
    });
  }
};

// **📌 Memperbarui Invoice**
export const updateInvoice = async (req, res) => {
  const { id } = req.params;
  const { total_amount, due_date, description, quantity, unit_price, subtotal, status } = req.body;

  try {
    const invoice = await Invoice.findOne({ where: { id_invoice: id } });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice tidak ditemukan",
      });
    }

    await invoice.update({
      total_amount,
      due_date,
      description,
      quantity,
      unit_price,
      subtotal,
      status,
    });

    return res.status(200).json({
      message: "Invoice berhasil diperbarui",
      data: invoice,
    });
  } catch (error) {
   logger.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat memperbarui invoice",
      error: error.message,
    });
  }
};

// **📌 Menghapus Invoice**
export const deleteInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await Invoice.findOne({ where: { id_invoice: id } });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice tidak ditemukan",
      });
    }

    await invoice.destroy();

    return res.status(200).json({
      message: "Invoice berhasil dihapus",
    });
  } catch (error) {
   logger.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat menghapus invoice",
      error: error.message,
    });
  }
};
