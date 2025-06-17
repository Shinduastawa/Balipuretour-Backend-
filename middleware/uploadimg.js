import multer from "multer";

// ✅ Gunakan penyimpanan ke memory (buffer) agar bisa ditulis manual ke folder dinamis
const storage = multer.memoryStorage();

// ✅ Middleware upload untuk banyak gambar (dipakai saat tambah paket)
const upload = multer({ storage });

export default upload;
