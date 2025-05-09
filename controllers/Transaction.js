import Booking from "../models/BookingModel.js";
import Transaction from "../models/TransactionModel.js";

export const getTransactionByBookingId = async (req, res) => {
  try {
    const { id_booking } = req.params;

    // 🔍 Cari transaksi berdasarkan id_booking
    const transaction = await Transaction.findOne({ where: { id_booking } });
    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    res.status(200).json({ data: transaction });
  } catch (error) {
    console.error("❌ Error fetching transaction:", error);
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};




// 🔥 Ambil transaksi berdasarkan ID User
export const getLatestTransactionByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // 🔍 Ambil semua booking milik user
    const userBookings = await Booking.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]], // Urutkan dari yang terbaru
    });

    if (userBookings.length === 0) {
      return res.status(404).json({ message: "User belum memiliki booking." });
    }

    // 🔥 Ambil booking terbaru
    const latestBooking = userBookings[0];

    // 🔍 Cari transaksi berdasarkan id_booking
    const transaction = await Transaction.findOne({
      where: { id_booking: latestBooking.id_booking },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan untuk booking ini." });
    }

    res.status(200).json({ data: transaction });
  } catch (error) {
    console.error("❌ Error fetching transaction:", error);
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};
