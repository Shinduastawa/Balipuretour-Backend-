import CardDestination from "../models/CardDestinationModel.js";
import PackageTour from "../models/PackgeTourModel.js";
import Galeries from "../models/GaleriesModel.js";
import Rundown from "../models/RundownModel.js";
import Booking from "../models/BookingModel.js";
import fs from "fs";
import multer from "multer";
import path from "path";

export const createCardDestination = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Gagal mengupload gambar", error: err.message });
    }

    try {
      const packageTour = await PackageTour.findOne({
        where: { package_name: req.body.package_name },
      });

      if (!packageTour) {
        return res.status(404).json({ message: "PackageTour tidak ditemukan" });
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const newCard = await CardDestination.create({
        id_package: packageTour.id_package,
        card_name: req.body.card_name,
        about_card: req.body.about_card,
        location: req.body.location,
        price: req.body.price,
        note_card: req.body.note_card,
        img: imageUrl, // Simpan gambar ke database
      });

      res.status(201).json({ message: "Card destination berhasil disimpan", data: newCard });

    } catch (error) {
      res.status(400).json({ message: "Gagal menyimpan card destination", error: error.message });
    }
  });
};




// Konfigurasi Multer untuk Upload Gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder penyimpanan gambar
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file dengan timestamp
  },
});

const upload = multer({ storage }).single("image"); // Hanya menerima satu file

export const updateCardDestination = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Gagal mengupload gambar", error: err.message });
    }

    try {
      const { id } = req.params;

      // Cari CardDestination berdasarkan ID
      const cardDestination = await CardDestination.findOne({
        where: { id: id },
      });

      if (!cardDestination) {
        return res.status(404).json({ message: "CardDestination tidak ditemukan" });
      }

      // Ambil data dari request body
      const { card_name, about_card, location, price, note_card } = req.body;

      let imageUrl = cardDestination.img; // Default ke gambar lama

      if (req.file) {
        // ✅ Hapus gambar lama jika ada gambar baru
        if (cardDestination.img) {
          const oldImagePath = path.join("uploads", path.basename(cardDestination.img));
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath); // Hapus file lama
          }
        }
        imageUrl = `/uploads/${req.file.filename}`; // Set gambar baru
      }

      // Update data di database
      await cardDestination.update({
        card_name: card_name || cardDestination.card_name,
        about_card: about_card || cardDestination.about_card,
        location: location || cardDestination.location_card,
        price: price || cardDestination.price,
        note_card: note_card || cardDestination.note_card,
        img: imageUrl, // Update gambar jika ada yang baru
      });

      res.status(200).json({
        message: "CardDestination berhasil diperbarui",
        data: cardDestination,
      });

    } catch (error) {
      res.status(400).json({
        message: "Gagal memperbarui CardDestination",
        error: error.message,
      });
    }
  });
};

// Api fetch Data All CardPackgeTour
export const getAllCardDestinations = async (req, res) => {
  try {
    const cards = await CardDestination.findAll(); // Ambil semua data dari tabel
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data", error: error.message });
  }
};

// Delete CardDestination and related PackageTour with dependencies
export const deleteCardDestinationWithPackageTour = async (req, res) => {
  const { id } = req.params; // Ambil id dari parameter URL

  try {
    // Cari CardDestination berdasarkan id
    const cardDestination = await CardDestination.findOne({
      where: { id },
    });

    if (!cardDestination) {
      return res.status(404).json({
        message: "CardDestination tidak ditemukan",
      });
    }

    // Ambil id_package yang terkait dari cardDestination
    const { id_package } = cardDestination;

    // Pastikan id_package valid sebelum melanjutkan penghapusan
    if (!id_package) {
      return res.status(400).json({
        message: "ID package tidak valid atau tidak ditemukan",
      });
    }

    // Hapus semua booking yang terkait dengan package
    await Booking.destroy({ where: { id_package } });

    // Hapus semua Galeries dan Rundown yang terkait terlebih dahulu
    await Galeries.destroy({ where: { id_package } });
    await Rundown.destroy({ where: { id_package } });

    // Hapus CardDestination
    await CardDestination.destroy({ where: { id } });

    // Hapus PackageTour setelah data terkait sudah dihapus
    await PackageTour.destroy({ where: { id_package } });

    res.status(200).json({
      message: "CardDestination dan PackageTour beserta data terkait berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus CardDestination dan PackageTour",
      error: error.message,
    });
  }
};


export const getGalleryImages = async (req, res) => {
  try {
    // Ambil gambar default berdasarkan ID tertentu
    const defaultGalleryImages = await Galeries.findAll({
      where: { id: [312, 392, 352, 372, 420, 431] },
      attributes: ["id", "img", "id_package"], // Tambahkan id_package di sini
    });


    // Ambil gambar terbaru jika ada update

    const latestGalleryImages = await Galeries.findAll({
      attributes: ["id", "img", "id_package"],
      order: [["createdAt", "DESC"]],
      limit: 10, // Ambil lebih banyak gambar terbaru
    });



    // Jika ada gambar terbaru, jadikan sebagai default, jika tidak pakai default yang sudah ditentukan
    const finalGalleryImages = [...defaultGalleryImages, ...latestGalleryImages];


    const baseUrl = "http://localhost:5000";

    // Format path gambar agar sesuai URL
    const formattedImages = finalGalleryImages.map((image) => ({
      ...image.toJSON(),
      img: `${baseUrl}/${image.img.replace(/^\/+/, "")}`,
    }));

    res.status(200).json(formattedImages);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data gambar galeri",
      error: error.message,
    });
  }
};



export const getCardDestinationById = async (req, res) => {
  try {
    const { id } = req.params;

    const cardDestination = await CardDestination.findOne({
      where: { id },
    });

    if (!cardDestination) {
      return res.status(404).json({ message: "CardDestination tidak ditemukan" });
    }

    res.status(200).json(cardDestination);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data CardDestination",
      error: error.message,
    });
  }
};
