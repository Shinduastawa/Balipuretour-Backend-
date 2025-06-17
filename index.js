// import express from "express";
// import dotenv from "dotenv";
// import db from "./config/Database.js";
// import cookieParser from "cookie-parser";
// import cors from "cors";
// import router from "./routes/index.js";
// import admin from "./firebaseAdmin.js"; // Import Firebase Admin SDK


// import path from "path";
// import fs from "fs";
// import multer from "multer";
// import { fileURLToPath } from "url";
// // import Booking from "./models/BookingModel.js";
// // import AvailableDatesModel from "./models/InvoiceModel.js";

// // Dapatkan direktori saat ini
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


// // Cek koneksi ke Firebase (opsional)
// admin
//   .auth()
//   .listUsers(1)
//   .then(() => console.log("Firebase Admin SDK terhubung"))
//   .catch((error) => console.error("Firebase Admin SDK error:", error));

// dotenv.config();

// // try {
// //   await db.authenticate();
// //   console.log('Database Connceted......');
// //   await AvailableDatesModel.sync();
// // } catch (error) {

// // }

// // try {
// //   await db.authenticate();
// //   console.log("Database Connected......");
// //   await Booking.sync({ alter: true }); // Sync dengan perubahan struktur
// //   console.log("Booking table updated!");
// // } catch (error) {
// //   console.error("Error updating database:", error);
// // }


// const app = express();

// const corsOptions = {
//   origin: ["http://localhost:3000", "http://localhost:5173"], // Pastikan sesuai dengan frontend
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true, // Penting untuk pengiriman cookie/token
// };

// app.use(cors(corsOptions));
// app.use(cookieParser());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use("/public", express.static("public"));


// // Middleware untuk serve file statis (gambar bisa diakses dari frontend)
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use(express.static(path.join(__dirname, "public")));

// // Pastikan folder "uploads" ada
// const uploadDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Konfigurasi Multer untuk penyimpanan gambar
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname)); // Rename file dengan timestamp
//   },
// });
// const upload = multer({ storage });

// // Tambahkan router API setelah middleware statis
// app.use(router);

// app.get("/", (req, res) => {
//   res.send("✅ Backend Bali Pure Tour API is running!");
// });

// app.use((req, res, next) => {
//   console.log(`Request masuk: ${req.method} ${req.url}`);
//   next();
// });

// app.use((req, res, next) => {
//   console.log(`Request masuk: ${req.method} ${req.url}`);
//   next();
// });

// // Sample route
// app.get('/', (req, res) => {
//   res.send('API is running...');
// });

// // Koneksi database
// try {
//   await db.authenticate();
//   console.log("Database Connected");
// } catch (error) {
//   console.error("Database connection error:", error);
// }

// // Jalankan server di port 5000
// app.listen(5000, () => console.log("Server running at port 5000"));

import express from "express";
import dotenv from "dotenv";
import db from "./config/Database.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./routes/index.js";
import admin from "./firebaseAdmin.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import CardDestinationModel from "./models/CardDestinationModel.js";

// Load environment variables
dotenv.config();

// Path util
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS config
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://balipuretour.com",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files from "public" directly
app.use(express.static(path.join(__dirname, "public")));

// Optional: serve additional folders if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/default', express.static(path.join(__dirname, 'public/default')));
app.use('/tour-gallery', express.static(path.join(__dirname, 'public/tour-gallery')));

// Cek koneksi Firebase
admin
  .auth()
  .listUsers(1)
  .then(() => console.log("✅ Firebase Admin SDK terhubung"))
  .catch((error) => console.error("❌ Firebase Admin SDK error:", error));

// Cek koneksi database & sync model
try {
  await db.authenticate();
  console.log("✅ Database Connected");

  await CardDestinationModel.sync({ alter: true });
  console.log("✅ CardDestinationModel table updated!");
} catch (error) {
  console.error("❌ Error updating database:", error);
}

// ⛳ Pastikan folder "uploads" dan "public/gallery_*" tersedia
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const galleryBase = path.join(__dirname, "public");
const galleryPrefix = "gallery_";
for (let i = 0; i < 1000; i++) {
  const galleryFolder = path.join(galleryBase, `${galleryPrefix}${i}`);
  if (!fs.existsSync(galleryFolder)) {
    fs.mkdirSync(galleryFolder, { recursive: true });
  }
}

// Multer config (contoh)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Routes
app.use(router);

// Debug log request
app.use((req, res, next) => {
  console.log(`Request masuk: ${req.method} ${req.url}`);
  next();
});

// Test endpoint
app.get("/", (req, res) => {
  res.send("✅ Backend Bali Pure Tour API is running!");
});

// Server run
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
});
