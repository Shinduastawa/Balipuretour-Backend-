
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, sendEmailVerification } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB45-UAhVk13ms7aQRtJfo-wAl5oHllCvE",
  authDomain: "pt-bali-pure-tour.firebaseapp.com",
  projectId: "pt-bali-pure-tour",
  storageBucket: "pt-bali-pure-tour.firebasestorage.app",
  messagingSenderId: "781917276998",
  appId: "1:781917276998:web:12afe2d77eabdbc23d7347",
  measurementId: "G-8GHN755XZX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, signOut, sendEmailVerification };