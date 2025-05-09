import User from "../models/UserModel.js";
import bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from "uuid"; // Tambahkan UUID generator
import jwt from "jsonwebtoken";
import firebaseAdmin from "../firebaseAdmin.js";
import Inbox from "../models/InboxModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";


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
  const { name, email, phone_number, password } = req.body;

  if (!name || !email || !phone_number || !password) {
    return res.status(400).json({ msg: "Semua field harus diisi" });
  }

  const salt = await bcryptjs.genSalt();
  const hashPassword = await bcryptjs.hash(password, salt);

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ msg: "Email sudah terdaftar" });
    }

    await User.create({
      name,
      email,
      phone_number,
      password: hashPassword,
      uid: uuidv4(), // Gunakan UUID sebagai UID untuk registrasi manual
      verified: false, // Default belum diverifikasi
    });

    res.json({ msg: "Yeayy Register Berhasil" });
  } catch (error) {
    console.error("Error saat registrasi manual:", error);
    res.status(500).json({ msg: "Terjadi kesalahan saat registrasi", error: error.message });
  }
};



export const Login = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(404).json({ msg: "Email Tidak Terdaftar" });

    const match = await bcryptjs.compare(req.body.password, user.password);
    if (!match) return res.status(400).json({ msg: "Password salah" });

    const userId = user.id;
    const name = user.name;
    const email = user.email;
    const profilePicture = user.profilePicture || "default.jpg";

    const accessToken = jwt.sign({ userId, name, email, profilePicture }, process.env.ACCSESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId, name, email, profilePicture }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });

    await User.update({ refresh_token: refreshToken }, { where: { id: userId } });

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000, sameSite: "Strict" });

    res.json({ accessToken, user });

    // ⬇️ Tambahkan notifikasi login
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
