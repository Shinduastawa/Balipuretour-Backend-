// uploadimg.js
import multer from "multer";

// Simpan file di memory sebagai buffer
const storage = multer.memoryStorage();

// ✅ HANYA export instance multer, BUKAN langsung array()
const upload = multer({ storage });

export default upload;
