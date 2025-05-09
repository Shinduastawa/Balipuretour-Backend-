import fs from "fs";
import multer from "multer";
import path from "path";
import { Op } from "sequelize";
import Galeries from "../models/GaleriesModel.js";

// **Konfigurasi multer untuk menyimpan gambar berdasarkan kategori**
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || "default";
    const uploadPath = `public/${category}`;
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadGallery = multer({ storage }).fields([
  { name: "newImages", maxCount: 10 },
]);

export const uploadGalleryImages = async (req, res) => {
  multer({ storage }).array("images", 10)(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Gagal mengupload gambar", error: err.message });
    }

    try {
      const { id_package, category } = req.body;
      if (!id_package) {
        return res.status(400).json({ message: "ID package harus disertakan" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "File gambar tidak ditemukan" });
      }

      const galeriesData = req.files.map((file) => ({
        id_package,
        img: `/${category}/${file.filename}`,
      }));

      await Galeries.bulkCreate(galeriesData);

      res.status(201).json({
        message: "Gambar berhasil diunggah",
        data: galeriesData,
      });
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
  });
};



export const updateGalleryImages = async (req, res) => {
  uploadGallery(req, res, async (err) => {
    if (err) {
      return res.status(500).json({
        message: "Gagal mengupload gambar",
        error: err.message,
      });
    }

    try {
      const { id_package } = req.params;
      const { remainingImageIds, category } = req.body;

      if (!id_package) {
        return res.status(400).json({
          message: "ID package harus disertakan",
        });
      }

      // ✅ Hapus gambar yang tidak dipertahankan, hanya jika remainingImageIds dikirim
      if (remainingImageIds) {
        let remainingIds = [];
        try {
          remainingIds = JSON.parse(remainingImageIds);
        } catch (parseErr) {
          return res.status(400).json({
            message: "Format remainingImageIds tidak valid (harus JSON array)",
          });
        }

        // Cek apakah array dan ada isinya
        if (Array.isArray(remainingIds) && remainingIds.length > 0) {
          await Galeries.destroy({
            where: {
              id_package,
              id: { [Op.notIn]: remainingIds },
            },
          });
        }
      }

      // ✅ Upload gambar baru jika ada
      if (req.files && req.files.newImages) {
        const files = Array.isArray(req.files.newImages)
          ? req.files.newImages
          : [req.files.newImages];

        const galeriesData = files.map((file) => ({
          id_package,
          img: `/${category || "default"}/${file.filename}`,
        }));

        await Galeries.bulkCreate(galeriesData);
      }

      res.status(200).json({
        message: "Galeri berhasil diperbarui",
      });
    } catch (error) {
      console.error("❌ Gagal update galeri:", error);
      res.status(500).json({
        message: "Terjadi kesalahan",
        error: error.message,
      });
    }
  });
};
