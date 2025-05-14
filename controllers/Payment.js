import dotenv from "dotenv";
import midtransClient from "midtrans-client";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import Transaction from "../models/TransactionModel.js";
import { sendInvoiceEmail, generateInvoicePDF } from "../services/sendInvoiceEmail.js";
dotenv.config();

dayjs.extend(utc);
dayjs.extend(timezone);

const snap = new midtransClient.Snap({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

export const createPayment = async (req, res) => {
  try {
    console.log("📥 Data yang diterima dari frontend:", req.body);

    const {
      id_booking,
      total_price,
      full_name,
      email,
      phone_number,
      package_name,
      num_participants,
      checkin_date,
      payment_method,
      payment_numbers
    } = req.body;

    // 🔍 Validasi wajib
    if (!id_booking || !total_price || !email || !phone_number) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🆔 Buat Order ID Unik
    const order_id = `order-${id_booking}-${Date.now()}`;

    // 📅 Format checkin_date
    const formattedCheckinDate = checkin_date && checkin_date !== "-" ? checkin_date : null;

    // 💾 Simpan ke database sebelum transaksi Midtrans
    await Transaction.create({
      order_id,
      id_booking,
      total_price,
      payment_status: "pending",
      transaction_date: new Date(),
      full_name,
      email,
      phone_number,
      package_name,
      num_participants,
      checkin_date: formattedCheckinDate,
      payment_method,
      payment_numbers,
    });

    // 🕒 Format start_time (Midtrans minta dalam format "YYYY-MM-DD HH:mm:ss Z")
    const start_time = dayjs().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss Z");
    console.log("🕒 Expiry Start Time:", start_time);

    // 📦 Parameter Midtrans
    const parameter = {
      transaction_details: {
        order_id,
        gross_amount: Math.round(total_price),
      },
      credit_card: { secure: true },
      customer_details: {
        first_name: full_name ? full_name.split(" ")[0] : "Customer",
        email,
        phone: phone_number,
      },
      expiry: {
        start_time,
        unit: "hour",
        duration: 1, // Berlaku 1 jam
      },
    };

    // 🔁 Request ke Midtrans
    const transaction = await snap.createTransaction(parameter);
    console.log("✅ Transaction Token:", transaction.token);

    res.json({ token: transaction.token });
  } catch (error) {
    console.error("❌ Error di Backend:", error);

    // 💥 Jika error dari Midtrans
    if (error.response && error.response.data) {
      console.error("❌ Midtrans Error Response:", error.response.data);
    }

    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
      midtrans_error: error.response?.data || null,
    });
  }
};



export const paymentNotification = async (req, res) => {
  try {
    console.log("📌 Notifikasi Midtrans Diterima:", req.body);

    const { order_id, transaction_status, va_numbers, payment_type } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    let payment_status = "pending";
    let payment_method = "Unknown"; // Default kalau data kosong
    let payment_numbers = null;


    // 🔥 **Ambil Payment Method dari Midtrans**
    if (va_numbers && va_numbers.length > 0) {
      payment_method = va_numbers[0].bank.toUpperCase(); // Misal: "BNI", "BRI"
      payment_numbers = JSON.stringify(va_numbers); // Simpan VA Numbers dalam bentuk JSON
    } else if (payment_type) {
      payment_method = payment_type.toUpperCase(); // Misal: "GOPAY", "SHOPEEPAY"
    }

    console.log("💰 Metode Pembayaran:", payment_method);
    console.log("📌 Nomor VA:", payment_numbers);

    if (transaction_status === "settlement" || transaction_status === "capture") {
      payment_status = "paid";
    } else if (["deny", "expire", "cancel"].includes(transaction_status)) {
      payment_status = "failed";
    }

    // ✅ **Cari transaksi berdasarkan order_id**
    const transaction = await Transaction.findOne({ where: { order_id } });

    if (!transaction) {
      console.log(`⚠️ Tidak ada transaksi dengan Order ID ${order_id} ditemukan.`);
      return res.status(404).json({ message: "Transaction not found" });
    }

    // let payment_numbers = null;

    if (va_numbers && va_numbers.length > 0) {
      payment_numbers = va_numbers[0].va_number; // Ambil hanya nomor VA
    }

    await Transaction.update(
      {
        payment_status,
        payment_method,
        payment_numbers, // Simpan hanya nomor VA
        updatedAt: new Date()
      },
      { where: { order_id } }
    );

    console.log(`✅ Status pembayaran ${order_id} diupdate jadi ${payment_status}, metode: ${payment_method}`);

    // 🔥 Kirim Invoice jika Paid
    // 🔥 Kirim Invoice jika Paid
    if (payment_status === "paid") {
      try {
        const updatedTransaction = await Transaction.findOne({ where: { order_id } });

        // ✅ Generate PDF dan ambil localPath
        const { localPath } = await generateInvoicePDF(updatedTransaction);

        // ✅ Kirim Email dengan file PDF sebagai lampiran (bukan URL)
        await sendInvoiceEmail(
          updatedTransaction.email,
          updatedTransaction.full_name,
          localPath
        );

        console.log("✅ Invoice berhasil dikirim ke email:", updatedTransaction.email);
      } catch (err) {
        console.error("❌ Gagal kirim invoice:", err.message);
      }
    }


    res.json({ message: "Payment status updated", status: payment_status });
  } catch (error) {
    console.error("❌ Error updating payment status:", error.message);
    res.status(500).json({ message: "Failed to update payment status", error: error.message });
  }
};


export const getTransactionDetail = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // 🔍 **Cari transaksi berdasarkan order_id**
    const transaction = await Transaction.findOne({
      where: { order_id },
      attributes: [
        "id_transaction",
        "order_id",
        "full_name",
        "email",
        "phone_number",
        "package_name",
        "num_participants",
        "checkin_date",
        "total_price",
        "payment_status",
        "transaction_date",
        "payment_method",
        "payment_numbers",
      ],
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // ✅ **Pastikan payment_numbers diparse ke JSON**
    let payment_numbers = [];
    if (transaction.payment_numbers) {
      try {
        payment_numbers = JSON.parse(transaction.payment_numbers);
      } catch (error) {
        console.error("❌ Error parsing payment_numbers:", error.message);
      }
    }

    res.json({ ...transaction.toJSON(), payment_numbers }); // Kirim hasil parsing
  } catch (error) {
    console.error("❌ Error fetching transaction:", error.message);
    res.status(500).json({ message: "Failed to fetch transaction", error: error.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      attributes: [
        "id_transaction",
        "order_id",
        "full_name",
        "package_name",
        "transaction_date",
        "payment_method",
        "payment_status",
      ],
      order: [["transaction_date", "DESC"]], // Urutkan transaksi dari terbaru
    });

    res.json(transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions:", error.message);
    res.status(500).json({ message: "Failed to fetch transactions", error: error.message });
  }
};