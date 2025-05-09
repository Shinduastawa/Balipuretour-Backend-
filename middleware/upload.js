import multer from "multer";
import fs from "fs";
import path from "path";

// Konfigurasi Penyimpanan (Folder Dinamis)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const packageName = req.body.package_name.replace(/\s+/g, "_").toLowerCase();
    const folderPath = path.join("public", `gallery_${packageName}`);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

export default upload;
