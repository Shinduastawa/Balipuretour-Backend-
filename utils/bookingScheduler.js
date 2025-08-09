import cron from "node-cron";
import Booking from "../models/BookingModel.js";  // Model booking
import Inbox from "../models/InboxModel.js";    // Model inbox
import AvailableDates from "../models/AvailableDatesModel.js"; // Model availabledates
import { Op } from "sequelize";
import logger from "./logger.js";

// ⏰ Jalan setiap 5 menit sekali
cron.schedule("*/5 * * * *", async () => {
  try {
    const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000);

    // Cari semua booking pending lebih dari 1 jam
    const bookings = await Booking.findAll({
      where: {
        status: "pending",
        createdAt: {
          [Op.lte]: satuJamLalu, // Booking yang dibuat lebih dari 1 jam lalu
        },
      },
    });

    if (bookings.length > 0) {
      logger.info(`⏳ Ada ${bookings.length} booking pending yang akan dibatalkan.`);

      for (const booking of bookings) {
        // 🔁 Ubah status available_date jadi available lagi jika booking dibatalkan
        if (booking.checkin_date && booking.id_package) {
          await AvailableDates.update(
            { status: "available" },
            {
              where: {
                id_package: booking.id_package,
                available_date: booking.checkin_date, // pastikan checkin_date sesuai dengan available_date
                status: "booked", // hanya ubah yang statusnya booked
              },
            }
          );
          logger.info(`✅ Updated available_date for booking ID ${booking.id_booking}`);
        }

        // ❌ Batalkan booking jika sudah lebih dari 1 jam dan statusnya pending
        booking.status = "canceled";
        await booking.save();

        // 📥 Tambahkan notifikasi ke inbox admin tentang pembatalan otomatis
        await Inbox.create({
          type: "auto_cancel",
          message: `Booking atas nama ${booking.full_name} otomatis dibatalkan karena tidak dibayar dalam 1 jam.`,
        });

        logger.info(`❌ Booking ID ${booking.id_booking} dibatalkan.`);
      }
    } else {
      logger.info("✅ Tidak ada booking yang perlu dibatalkan.");
    }
  } catch (error) {
    logger.error("🔥 Gagal menjalankan scheduler auto-cancel:", error.message);
  }
});
