

import express from "express";
import dotenv from "dotenv";
import db from "./config/Database.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./routes/index.js";  // Pastikan router di-import dengan benar
import admin from "./firebaseAdmin.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import CardDestinationModel from "./models/CardDestinationModel.js";
import logger from "./utils/logger.js";



// Load environment variables
dotenv.config();  // Pindahkan ke atas agar process.env bisa dibaca di bawah

// Dapatkan path untuk folder uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cek koneksi ke Firebase
admin
  .auth()
  .listUsers(1)
  .then(() => logger.info("Firebase Admin SDK terhubung"))
  .catch((error) => logger.error("Firebase Admin SDK error:", error));

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://balipuretour.com" // Tambahkan domain frontend kalau sudah deploy
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Untuk memungkinkan pengiriman cookie/token
};

try {
  await db.authenticate();
  logger.info("Database Connected......");
  await CardDestinationModel.sync({ alter: true }); // Sync dengan perubahan struktur
  logger.info("CardDestinationModel table updated!");
} catch (error) {
  logger.error("Error updating database:", error);
}

// Middleware setup
app.use(cors(corsOptions));  // Gunakan CORS
app.use(cookieParser());  // Middleware cookie-parser
app.use(express.json());  // Middleware untuk menerima JSON
app.use(express.urlencoded({ extended: true }));  // Middleware untuk URL encoding
app.use("/public", express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));  // Menyediakan akses untuk folder uploads
app.use(express.static(path.join(__dirname, "public")));  // Static files (misalnya gambar, CSS, dll.)
app.use('/tour-gallery', express.static(path.join(__dirname, 'public/tour-gallery')));
app.use('/default', express.static(path.join(__dirname, 'public/default')));
app.use(express.static("public")); // ✅ Ini yang membuat /gallery_xx bisa diakses

// Buat folder uploads jika belum ada
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan Multer untuk upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  // Menyimpan file di folder uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Menggunakan timestamp untuk nama file
  },
});
const upload = multer({ storage });

// Gunakan router utama (import route dari folder routes)
app.use(router);

// Endpoint utama
app.get("/", (req, res) => {
  res.send("✅ Backend Bali Pure Tour API is running!");
});

// Middleware untuk log setiap request
app.use((req, res, next) => {
  logger.info(`Request masuk: ${req.method} ${req.url}`);
  next();
});

// Koneksi ke database
try {
  await db.authenticate();  // Menghubungkan ke database
  logger.info("✅ Database Connected");

  logger.info("✅ AvailableDates table is synced.");
} catch (error) {
  logger.error("❌ Database connection error:", error);
}

// Jalankan server pada port yang ditentukan (default: 5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running at port ${PORT}`);
});
