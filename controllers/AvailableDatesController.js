import AvailableDates from "../models/AvailableDatesModel.js";
import PackageTour from "../models/PackgeTourModel.js";
import Inbox from "../models/InboxModel.js";
import db from "../config/Database.js";
import logger from "../utils/logger.js";

// ✅ Get All Available Dates (Semua tanggal tersedia)
export const getAllAvailableDates = async (req, res) => {
  try {
    const dates = await AvailableDates.findAll({
      include: [
        {
          model: PackageTour,
          as: "Package",
          attributes: ["package_name"], // Ambil hanya nama paket
        },
      ],
      order: [["available_date", "ASC"]],
    });
    res.status(200).json(dates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Available Dates by Package ID (Ambil tanggal berdasarkan id_package)
export const getAvailableDatesByPackage = async (req, res) => {
  try {
    const { id_package } = req.params;
    const dates = await AvailableDates.findAll({
      where: { id_package },
      order: [["available_date", "ASC"]],
    });

    if (dates.length === 0) {
      return res.status(404).json({ message: "No available dates found" });
    }

    res.status(200).json(dates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableDatesSlot = async (req, res) => {
  try {
    const { id_package } = req.params;

    // Ambil hanya tanggal dengan status "available" berdasarkan id_package
    const availableDates = await AvailableDates.findAll({
      where: {
        id_package: id_package,
        status: "available",
      },
      attributes: ["id_date", "available_date"], // Ambil hanya field yang diperlukan
      order: [["available_date", "ASC"]],
    });

    // Kirim jumlah slot yang tersedia
    res.json({
      count: availableDates.length,
      dates: availableDates,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching available dates", error });
  }
};


// ✅ Add New Available Date (Tambah tanggal baru)
export const addAvailableDate = async (req, res) => {
  try {
    const { id_package, available_date } = req.body;

    if (!id_package || !available_date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newDate = await AvailableDates.create({
      id_package,
      available_date,
    });

    res.status(201).json(newDate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Available Date (Hapus tanggal berdasarkan ID)
export const deleteAvailableDate = async (req, res) => {
  try {
    const { id_date } = req.params;

    const date = await AvailableDates.findByPk(id_date);
    if (!date) {
      return res.status(404).json({ message: "Date not found" });
    }

    await date.destroy();
    res.status(200).json({ message: "Available date deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const bookDate = async (req, res) => {
  const t = await db.transaction();

  try {
    const { id_package, checkin_date } = req.body;
    const user_id = req.user.id;

    if (!user_id) {
      await t.rollback();
      return res.status(401).json({ message: "Session login telah habis. Silakan login kembali." });
    }

    const availableDate = await AvailableDates.findOne({
      where: {
        id_package,
        available_date: checkin_date,
        status: "available"
      },
      transaction: t
    });

    if (!availableDate) {
      await t.rollback();
      return res.status(400).json({ message: "Tanggal tidak tersedia atau sudah dibooking." });
    }

    // ✅ Ubah status tanggal jadi "booked"
    await AvailableDates.update(
      { status: "booked" },
      {
        where: { id_date: availableDate.id_date },
        transaction: t
      }
    );

    // ✅ Cek apakah semua tanggal di paket ini sudah habis
    const sisaTanggal = await AvailableDates.findAll({
      where: { id_package, status: "available" },
      transaction: t
    });

    if (sisaTanggal.length === 0) {
      const paket = await PackageTour.findByPk(id_package, { transaction: t });
      const namaPaket = paket?.package_name || "Paket Tidak Diketahui";

      setTimeout(() => {
        Inbox.create({
          type: "booking_full",
          message: `Semua tanggal untuk paket "${namaPaket}" sudah dibooking.`,
        });
      }, 0);
    }

    await t.commit();

    return res.status(200).json({
      message: "Tanggal berhasil dibooking!",
      id_date: availableDate.id_date
    });

  } catch (error) {
    logger.error("❌ Gagal booking:", error);
    await t.rollback();
    return res.status(500).json({ message: "Terjadi kesalahan saat booking." });
  }
};





export const updateAvailableDates = async (req, res) => {
  try {
    const { id_package, availableDates } = req.body;

    if (!id_package || !availableDates) {
      return res.status(400).json({ message: "id_package dan availableDates wajib diisi" });
    }

    for (const date of availableDates) {
      // Cek apakah tanggal sudah ada di database
      const existingDate = await AvailableDates.findOne({
        where: { id_package, available_date: date }
      });

      // Jika tidak ada, tambahkan tanggal baru
      if (!existingDate) {
        await AvailableDates.create({ id_package, available_date: date });
      }
    }

    return res.status(200).json({ message: "Available dates berhasil diperbarui", availableDates });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui available dates", error });
  }
};

// ✅ Get All Booked Dates (Ambil semua tanggal yang sudah dibooking)
export const getBookedDates = async (req, res) => {
  try {
    // Ambil tanggal dengan status "booked"
    const bookedDates = await AvailableDates.findAll({
      where: { status: "booked" },
      attributes: ["available_date"], // Ambil hanya field available_date
      order: [["available_date", "ASC"]], // Urutkan berdasarkan tanggal
    });

    // Kirim data tanggal yang sudah dibooking
    res.status(200).json(bookedDates);
  } catch (error) {
    logger.error("❌ Error fetching booked dates:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil tanggal yang dibooking." });
  }
};
