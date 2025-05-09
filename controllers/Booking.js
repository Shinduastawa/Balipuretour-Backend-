import Booking from "../models/BookingModel.js";
import PackageTour from "../models/PackgeTourModel.js";
import Inbox from "../models/InboxModel.js"; // ⬅️ Tambahin ini di atas
import AvailableDates from "../models/AvailableDatesModel.js";


// ✅ Buat Booking Baru
export const createBooking = async (req, res) => {
  try {
    console.log("🔍 User dari Token:", req.user); // Debug user dari token

    const { full_name, email, phone_number, id_package, package_name, num_participants, checkin_date, price, price_idr, id_date } = req.body;
    const user_id = req.user?.id; // Gunakan req.user.id

    if (!user_id) {
      console.error("❌ User tidak terautentikasi!");
      return res.status(401).json({ message: "User tidak terautentikasi" });
    }

    if (!full_name || !phone_number || !id_package || !num_participants || !checkin_date || !price) {
      console.error("❌ Data booking tidak lengkap!");
      return res.status(400).json({ message: "Semua field harus diisi" });
    }

    const formattedDate = new Date(checkin_date).toISOString().split("T")[0];

    const newBooking = await Booking.create({
      user_id,
      full_name,
      email,
      phone_number,
      id_package,
      package_name,
      num_participants,
      checkin_date: formattedDate,
      price,
      price_idr,
      id_date,
    });
    // 🔔 Kirim notifikasi ke Inbox
    console.log("ID Date yang diterima:", id_date); // Debug

    await Inbox.create({
      type: "new_booking",
      message: `Booking baru dibuat oleh ${full_name} untuk paket "${package_name}".`,
    });
    res.status(201).json({ message: "✅ Booking berhasil!", booking: newBooking });

  } catch (error) {
    console.error("❌ Error saat membuat booking:", error.message);
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};


// ✅ Ambil Semua Booking
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [{ model: PackageTour, as: "Package" }],
      order: [['createdAt', 'DESC']], // ✅ Urutkan dari terbaru
    });
    res.status(200).json({ data: bookings });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// ✅ Ambil Booking Berdasarkan ID
export const getBookingById = async (req, res) => {
  try {
    const { id_booking } = req.params;  // ✅ Benar
    const booking = await Booking.findByPk(id_booking, {
      include: [{ model: PackageTour, as: "Package" }],
    });

    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });
    res.status(200).json({ data: booking });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// ✅ Update Status Booking Setelah Pembayaran
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatus = ["pending", "confirmed", "canceled"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });

    booking.status = status;
    await booking.save();

    if (status === "confirmed") {
      await Inbox.create({
        type: "payment_success",
        message: `Pembayaran berhasil untuk booking atas nama ${booking.full_name}.`,
      });
    }

    // ✅ Kalau status jadi canceled, balikin tanggal jadi available
    if (status === "canceled" && booking.id_date) {
      await AvailableDates.update(
        { status: "available" },
        { where: { id_date: booking.id_date } }
      );

      await Inbox.create({
        type: "booking_canceled",
        message: `Booking atas nama ${booking.full_name} telah dibatalkan.`,
      });
    }

    res.status(200).json({ message: "Status booking berhasil diperbarui", data: booking });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// ✅ Hapus Booking
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });

    await booking.destroy();
    res.status(200).json({ message: "Booking berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// ✅ Ambil Booking Berdasarkan User yang Login
export const getUserBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({ message: "User tidak terautentikasi" });
    }

    const userId = req.user.id; // ✅ Ambil user ID dari token

    const bookings = await Booking.findAll({
      where: { user_id: userId },
      include: [{ model: PackageTour, as: "Package" }],
      order: [['createdAt', 'DESC']], // ✅ Urutkan dari terbaru
    });

    if (bookings.length === 0) {
      return res.status(404).json({ message: "Tidak ada booking ditemukan" });
    }

    res.json({ data: bookings });

  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// ✅ Update Status Booking oleh Admin
export const updateBookingStatusByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatus = ["pending", "confirmed", "canceled"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });

    // 🔥 Update status booking
    booking.status = status;
    await booking.save();

    // ✅ Jika dikonfirmasi
    if (status === "confirmed") {
      // Ubah tanggal jadi booked lagi
      if (booking.id_date) {
        await AvailableDates.update(
          { status: "booked" },
          { where: { id_date: booking.id_date } }
        );
      }

      await Inbox.create({
        type: "payment_success",
        message: `Pembayaran berhasil untuk booking atas nama ${booking.full_name}.`,
      });
    }

    // ✅ Jika dibatalkan oleh admin
    if (status === "canceled" && booking.id_date) {
      await AvailableDates.update(
        { status: "available" },
        { where: { id_date: booking.id_date } }
      );

      await Inbox.create({
        type: "booking_canceled",
        message: `Booking atas nama ${booking.full_name} telah dibatalkan oleh admin.`,
      });
    }

    res.status(200).json({
      message: `Status booking ${id} berhasil diupdate ke ${status}`,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};
