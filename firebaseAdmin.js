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

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default firebaseAdmin;
