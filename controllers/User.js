import User from "../models/UserModel.js";
import bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from "uuid"; // Tambahkan UUID generator
import jwt from "jsonwebtoken";
import firebaseAdmin from "../firebaseAdmin.js";
import Inbox from "../models/InboxModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import validator from "validator"; // Tambahkan di bagian atas
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // atau sesuaikan SMTP kamu
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Setup Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "public/uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ Export middleware dan handler-nya
export const uploadPhoto = upload.single("photo");

export const handlePhotoUpload = (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ filename: req.file.filename, url: imageUrl });
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.userId, // Filter berdasarkan userId dari token
      },
      attributes: [
        'id',
        'name',
        'email',
        'phone_number',
        'birth_date',
        'gender',
        'photo_profile', // Tambahkan atribut foto profil
      ],
    });
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};


// Registrasi Pengguna Baru
export const Register = async (req, res) => {
  const { name, email, phone_number, password, verified } = req.body;

  // Validate empty fields
  if (!name || !email || !phone_number || !password) {
    return res.status(400).json({ msg: "All fields must be filled out" });
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ msg: "Invalid email format" });
  }

  // Validate phone number: digits only, minimum 8 digits
  const phoneRegex = /^[0-9]{8,15}$/;
  if (!phoneRegex.test(phone_number)) {
    return res.status(400).json({ msg: "Invalid phone number (digits only, minimum 8 characters)" });
  }

  // Validate password length
  if (password.length < 8) {
    return res.status(400).json({ msg: "Password must be at least 8 characters long" });
  }


  const salt = await bcryptjs.genSalt();
  const hashPassword = await bcryptjs.hash(password, salt);

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ msg: "Email is already registered" });
    }

    // Buat user baru
    await User.create({
      name,
      email,
      phone_number,
      password: hashPassword,
      uid: uuidv4(),
      verified: verified || false,
    });

    // Buat token verifikasi email
    const verificationToken = jwt.sign(
      { email },
      process.env.EMAIL_VERIFICATION_SECRET,
      { expiresIn: "1d" }
    );

    // Buat link verifikasi
    const verificationUrl = `${process.env.BACKEND_URL}/api/verifyEmailNonfirebase?token=${verificationToken}`;
    console.log("EMAIL_VERIFICATION_SECRET:", process.env.EMAIL_VERIFICATION_SECRET);

    // Kirim email verifikasi
    await transporter.sendMail({
      from: `"Bali Pure Tour" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Bali Pure Tour",
      html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
      <h2 style="color: #333;">Hi ${name}!</h2>
      <p>Thank you for registering at <strong>Bali Pure Tour</strong>.</p>
      <p>To activate your account, please click the button below:</p>
      <a href="${verificationUrl}" style="display: inline-block; margin: 10px 0; padding: 10px 20px; background-color: #2e7d32; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If you did not sign up, please ignore this email.</p>
      <br />
      <p>Warm regards,<br />The Bali Pure Tour Team</p>
    </div>
  `
    });


    res.json({ msg: "Registration successful! Please check your email for verification." });

  } catch (error) {
    console.error("Error during registration:", error); // Tampilkan stack trace
    return res.status(500).json({
      msg: "An error occurred during registration",
      error: error.message,
      stack: error.stack
    });
  }


};



export const Login = async (req, res) => {
  const { email, password } = req.body;

  // Validasi input kosong
  if (!email || !password) {
    return res.status(400).json({ msg: "Email dan password wajib diisi" });
  }

  // Validasi format email
  if (!validator.isEmail(email)) {
    return res.status(400).json({ msg: "Format email tidak valid" });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ msg: "Email tidak terdaftar" });

    // ❗ Cek apakah sudah verifikasi email
    if (!user.verified) {
      return res.status(403).json({ msg: "Email belum diverifikasi. Silakan cek email Anda." });
    }
    const match = await bcryptjs.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Password salah" });

    const userId = user.id;
    const name = user.name;
    const profilePicture = user.profilePicture || "default.jpg";

    const accessToken = jwt.sign({ userId, name, email, profilePicture }, process.env.ACCSESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId, name, email, profilePicture }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });

    await User.update({ refresh_token: refreshToken }, { where: { id: userId } });

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000, sameSite: "Strict" });

    res.json({ accessToken, user });

    setTimeout(() => {
      Inbox.create({
        type: "user_login",
        message: `User ${user.name} berhasil login.`,
      });
    }, 0);

  } catch (error) {
    res.status(500).json({ msg: "Terjadi kesalahan" });
  }
};






export const Logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.sendStatus(204);
  }

  try {
    // Cari user berdasarkan refresh token
    const user = await User.findOne({
      where: {
        refresh_token: refreshToken
      }
    });

    // Jika user tidak ditemukan, kirim status 204 (No Content)
    if (!user) {
      return res.sendStatus(204);
    }

    // Update refresh token menjadi null
    await User.update({ refresh_token: null }, {
      where: {
        id: user.id
      }
    });

    // Hapus cookie refresh token
    res.clearCookie('refreshToken');
    res.json({ msg: "Yaaah kamu logout" });

  } catch (error) {
    // Jika ada error, log dan kirim status 500 (Internal Server Error)
    console.error(error);
    return res.sendStatus(500);
  }
};



export const UpdateUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.sendStatus(401); // Token tidak dikirim
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCSESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.sendStatus(403); // Token tidak valid
      }

      // Cari user berdasarkan ID dari token
      const user = await User.findOne({ where: { id: decoded.userId } });
      if (!user) {
        return res.sendStatus(403); // Pengguna tidak ditemukan
      }

      const { name, email, phone_number, birth_date, gender, photo_profile } = req.body;

      await User.update(
        { name, email, phone_number, birth_date, gender, photo_profile },
        { where: { id: user.id } }
      );

      const newAccessToken = jwt.sign(
        { userId: user.id, name, email, phone_number, birth_date, gender, photo_profile },
        process.env.ACCSESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({
        message: "Profile updated successfully",
        accessToken: newAccessToken,
      });
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.sendStatus(500);
  }
};



// Register Google
export const RegisterGoogle = async (req, res) => {
  const { name, email, uid, verified } = req.body;

  if (!name || !email || !uid) {
    return res.status(400).json({ msg: "Data tidak lengkap" });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ msg: "Email sudah terdaftar" });
    }

    const newUser = await User.create({
      name,
      email,
      uid,
      verified: verified || false, // Jika tidak ada, default false
      phone_number: "", // Default kosong karena Google tidak selalu memberikan
      role: "user", // Default user biasa
    });

    res.status(201).json({ msg: "Registrasi berhasil", user: newUser });
  } catch (error) {
    console.error("Error saat registrasi dengan Google:", error);
    res.status(500).json({ msg: "Terjadi kesalahan saat registrasi dengan Google", error: error.message });
  }
};


export const LoginGoogle = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) return res.status(404).json({ msg: "Email tidak terdaftar" });

  const userId = user.id; // Pastikan mengambil id dari database
  const name = user.name;
  const profilePicture = user.profilePicture || "default.jpg";

  // Generate token dengan userId
  const accessToken = jwt.sign(
    { userId, name, email, profilePicture },
    process.env.ACCSESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId, name, email, profilePicture },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  await User.update({ refresh_token: refreshToken }, { where: { id: userId } });

  res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000, sameSite: "Strict" });

  res.json({ accessToken, user });
};


//veridy email regisyter from and login

export const verifyEmailNonfirebase = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);
    const { email } = decoded;

    const [updated] = await User.update({ verified: true }, { where: { email } });

    if (updated === 0) {
      return res.status(400).json({ msg: "Email tidak ditemukan atau sudah diverifikasi." });
    }

    res.json({ msg: "Email berhasil diverifikasi! Silakan login." });
  } catch (error) {
    res.status(400).json({ msg: "Token tidak valid atau sudah kadaluarsa." });
  }
};



// Vrifiy email Google


export const Verifyemail = async (req, res) => {
  const { uid, email } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ msg: "UID dan Email diperlukan!" });
  }

  try {
    // Ambil data user dari Firebase Authentication
    const userRecord = await firebaseAdmin.auth().getUser(uid);

    if (userRecord.emailVerified) {
      // Update status verifikasi di database dengan Sequelize
      const [updateResult] = await User.update(
        { verified: true },
        { where: { email } }
      );

      if (updateResult > 0) {
        return res.json({ msg: "Email berhasil diverifikasi dan status diperbarui!" });
      } else {
        return res.json({ msg: "Email sudah diverifikasi sebelumnya di database." });
      }
    } else {
      return res.status(400).json({ msg: "Email belum diverifikasi!" });
    }
  } catch (error) {
    console.error("Error verifikasi email:", error);
    return res.status(500).json({ msg: "Terjadi kesalahan saat memverifikasi email.", error: error.message });
  }
};
