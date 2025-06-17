// uploadimg.js
import multer from "multer";

const storage = multer.memoryStorage(); // ✅ Simpan file di memori dulu
const upload = multer({ storage }).array("galeries", 10); // sesuai field yang dikirim dari frontend

export default upload;
