import Booking from "../models/BookingModel.js";
import PackageTour from "../models/PackgeTourModel.js";
import Inbox from "../models/InboxModel.js";
import AvailableDates from "../models/AvailableDatesModel.js";
import nodemailer from "nodemailer";

// ✅ Buat Booking Baru

// ✅ Buat Booking Baru
export const createBooking = async (req, res) => {
  try {
    console.log("🔍 User dari Token:", req.user);

    const {
      full_name,
      email,
      phone_number,
      id_package,
      package_name,
      num_participants,
      checkin_date,
      price,
      price_idr,
    } = req.body;

    const user_id = req.user?.id;

    if (!user_id) {
      console.error("❌ User tidak terautentikasi!");
      return res.status(401).json({ message: "User tidak terautentikasi" });
    }

    if (!full_name || !phone_number || !id_package || !num_participants || !checkin_date || !price) {
      console.error("❌ Data booking tidak lengkap!");
      return res.status(400).json({ message: "Semua field harus diisi" });
    }

    const formattedDate = new Date(checkin_date).toISOString().split("T")[0];

    // ✅ Cari tanggal yang tersedia berdasarkan paket dan tanggal
    const dateToCheck = await AvailableDates.findOne({
      where: {
        id_package,
        available_date: formattedDate,
        status: "available",
      },
    });


    if (!dateToCheck) {
      return res.status(400).json({ message: "Tanggal sudah dibooking atau tidak tersedia." });
    }

    // ✅ Buat booking
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
      id_date: dateToCheck.id_date,
    });

    if (!newBooking || !newBooking.id) {
      return res.status(500).json({ message: "Booking gagal dibuat." });
    }

    // ✅ Tandai tanggal sebagai 'booked'
    await AvailableDates.update(
      { status: "booked" },
      { where: { id_date: dateToCheck.id_date } }
    );

    // 🔔 Tambah ke Inbox
    await Inbox.create({
      type: "new_booking",
      message: `Booking baru dibuat oleh ${full_name} untuk paket "${package_name}".`,
    });

    // 📧 Kirim Email Notifikasi
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: "akun-email@gmail.com",
      to: "info.balipuretour@gmail.com",
      subject: `Booking Baru dari ${full_name}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h2>Booking Baru Diterima</h2>
            <p>Bali Pure Tour</p>
          </div>
          <div style="padding: 20px; background-color: #fafafa;">
            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
              <tr><td style="padding: 8px;"><strong>Nama</strong></td><td style="padding: 8px;">${full_name}</td></tr>
              <tr style="background-color: #f0f0f0;"><td style="padding: 8px;"><strong>Email</strong></td><td style="padding: 8px;">${email}</td></tr>
              <tr><td style="padding: 8px;"><strong>Telepon</strong></td><td style="padding: 8px;">${phone_number}</td></tr>
              <tr style="background-color: #f0f0f0;"><td style="padding: 8px;"><strong>Paket</strong></td><td style="padding: 8px;">${package_name}</td></tr>
              <tr><td style="padding: 8px;"><strong>Tanggal</strong></td><td style="padding: 8px;">${formattedDate}</td></tr>
              <tr style="background-color: #f0f0f0;"><td style="padding: 8px;"><strong>Jumlah Peserta</strong></td><td style="padding: 8px;">${num_participants}</td></tr>
              <tr><td style="padding: 8px;"><strong>Harga</strong></td><td style="padding: 8px;">${price} (${price_idr} IDR)</td></tr>
            </table>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">Silakan cek dashboard admin untuk melihat detail dan memproses booking ini.</p>
          </div>
          <div style="text-align: center; background-color: #f5f5f5; padding: 10px; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} Bali Pure Tour. All rights reserved.
          </div>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Gagal mengirim email:", err);
      } else {
        console.log("✅ Email terkirim:", info.response);
      }
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
    }


    res.status(200).json({
      message: `Status booking ${id} berhasil diupdate ke ${status}`,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};
