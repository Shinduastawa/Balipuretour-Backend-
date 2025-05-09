// import admin from "firebase-admin";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const serviceAccount = require("./config/serviceAccountKey.json");

// // Inisialisasi Firebase Admin
// const firebaseAdmin = admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// export default firebaseAdmin;

import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();  // Pastikan file .env dimuat

// Parsing konfigurasi Firebase dari variabel lingkungan
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

// Inisialisasi Firebase Admin dengan kredensial dari serviceAccount
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
