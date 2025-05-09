// import admin from "firebase-admin";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const serviceAccount = require("./config/serviceAccountKey.json");

// // Inisialisasi Firebase Admin
// const firebaseAdmin = admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// export default firebaseAdmin;

import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();  // Memuat file .env

const firebaseConfig = process.env.FIREBASE_CONFIG;

if (!firebaseConfig) {
  console.error('Firebase config not found in .env');
  process.exit(1);  // Hentikan aplikasi jika config tidak ditemukan
}

const serviceAccount = JSON.parse(firebaseConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
