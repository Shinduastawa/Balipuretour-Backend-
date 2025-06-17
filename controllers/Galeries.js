import multer from "multer";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";
import Galeries from "../models/GaleriesModel.js";

// Konfigurasi multer dengan penyimpanan dinamis ke folder gallery_<id_package>
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const id_package = req.body.id_package || req.params.id_package || req.query.id_package;
    const fallbackCategory = `gallery_${id_package || "default"}`;
    const category = req.query.category || fallbackCategory;

    const uploadPath = path.join("public", category);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    req.__galleryCategory = category;
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const filename = Date.now() + path.extname(file.originalname);
    req.__uploadedFileName = filename;
    cb(null, filename);
  },
});

// Untuk form upload banyak gambar (galeri)
const uploadGallery = multer({ storage }).fields([
  { name: "newImages", maxCount: 10 },
]);

// Untuk form upload 1 gambar (card destinasi)
const uploadSingle = multer({ storage }).single("image");

// ========== ENDPOINT 1: Upload Galeri Baru ==========
export const uploadGalleryImages = async (req, res) => {
  uploadGallery(req, res, async (err) => {
    if (err) return res.status(500).json({ message: "Gagal mengupload gambar", error: err.message });

    try {
      const { id_package } = req.body;
      const category = req.__galleryCategory;

      if (!id_package) return res.status(400).json({ message: "ID package harus disertakan" });
      if (!req.files || !req.files.newImages) return res.status(400).json({ message: "File gambar tidak ditemukan" });

      const galeriesData = req.files.newImages.map((file) => ({
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

// ========== ENDPOINT 2: Update Galeri ==========

export const updateGalleryImages = async (req, res) => {
  uploadGallery(req, res, async (err) => {
    if (err) return res.status(500).json({ message: "Gagal mengupload gambar", error: err.message });

    try {
      const { id_package } = req.params;
      let { remainingImageIds } = req.body;
      const category = req.__galleryCategory;

      if (!id_package) return res.status(400).json({ message: "ID package harus disertakan" });

      // Hapus gambar yang tidak dipertahankan
      if (remainingImageIds) {
        let keepIds = [];
        try {
          keepIds = JSON.parse(remainingImageIds);
        } catch {
          return res.status(400).json({ message: "Format remainingImageIds tidak valid (harus JSON array)" });
        }

        if (Array.isArray(keepIds) && keepIds.length > 0) {
          await Galeries.destroy({
            where: {
              id_package,
              id: { [Op.notIn]: keepIds },
            },
          });
        }
      }

      // Upload gambar baru jika ada
      if (req.files && req.files.newImages) {
        const files = req.files.newImages;
        const galeriesData = files.map((file) => ({
          id_package,
          img: `/${category}/${file.filename}`,
        }));

        await Galeries.bulkCreate(galeriesData);
      }

      res.status(200).json({ message: "Galeri berhasil diperbarui" });
    } catch (error) {
      res.status(500).json({ message: "Gagal update galeri", error: error.message });
    }
  });
};

export { uploadSingle };
