import fs from "fs";
import multer from "multer";
import path from "path";
import Galeries from "../models/GaleriesModel.js";

// **Konfigurasi multer untuk menyimpan gambar berdasarkan kategori**
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || "default"; // Kategori wajib dikirim dari frontend
    const uploadPath = `public/${category}`;

    // Buat folder jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Middleware upload
const uploadGallery = multer({ storage }).array("images", 10); // Bisa upload hingga 10 gambar

export default uploadGallery; // Tambahkan ini agar bisa diimpor sebagai default
