import admin from "firebase-admin";

const rawConfig = JSON.parse(process.env.FIREBASE_CONFIG);
rawConfig.private_key = rawConfig.private_key.replace(/\\n/g, "\n");

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(rawConfig),
});

export default firebaseAdmin;
