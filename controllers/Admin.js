
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import Admin from "../models/AdminModel.js";
import logger from "../utils/logger.js";


export const LoginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      return res.status(404).json({ msg: "Admin tidak ditemukan" });
    }

    const match = await bcryptjs.compare(password, admin.password);
    if (!match) {
      return res.status(400).json({ msg: "Password salah" });
    }

    const adminId = admin.id_admin;

    const accessToken = jwt.sign(
      { adminId, email, role: "admin" },
      process.env.ACCSESS_TOKEN_SECRET,
      { expiresIn: "15m" } // <= Samakan seperti user
    );





    const refreshToken = jwt.sign(
      { adminId, email, role: "admin" },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );


    // Simpan refresh token ke database admin
    await Admin.update({ refresh_token: refreshToken }, { where: { id_admin: adminId } });

    // Simpan refresh token di cookie
    res.cookie("refreshTokenAdmin", refreshToken, {
      httpOnly: true,
      secure: false, // set true kalau sudah pakai https
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "Strict",
    });

    res.json({ accessToken, admin });

  } catch (error) {
    logger.error("Error login admin:", error);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};



export const RegisterAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cek apakah username sudah terdaftar
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ msg: "Username sudah digunakan" });
    }

    // Hash password sebelum menyimpan ke database
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Simpan admin baru ke database
    const newAdmin = await Admin.create({
      email,
      password: hashedPassword
    });

    res.status(201).json({ msg: "Admin berhasil terdaftar", admin: newAdmin });

  } catch (error) {
    res.status(500).json({ msg: "Terjadi kesalahan pada server", error });
  }
};


export const getAdminProfile = async (req, res) => {
  try {
    logger.info("Decoded Admin ID:", req.admin.id_admin);

    const adminData = await Admin.findOne({
      where: { id_admin: req.admin.id_admin },
    });

    if (!adminData) return res.status(404).json({ message: "Admin tidak ditemukan" });

    res.json({
      id_admin: adminData.id_admin,
      email: adminData.email,
      role: "admin"
    });

  } catch (error) {
    logger.error("Error mengambil data admin:", error);
    res.status(500).json({ message: "Kesalahan server" });
  }
};

export const refreshTokenAdmin = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshTokenAdmin;
    if (!refreshToken) return res.sendStatus(401);

    const admin = await Admin.findOne({
      where: { refresh_token: refreshToken }
    });

    if (!admin) return res.sendStatus(403);

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.sendStatus(403);

      const accessToken = jwt.sign(
        {
          adminId: admin.id_admin,
          email: admin.email,
          role: "admin"
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    });

  } catch (error) {
    logger.error("Error refresh admin token:", error);
    res.sendStatus(500);
  }
};
