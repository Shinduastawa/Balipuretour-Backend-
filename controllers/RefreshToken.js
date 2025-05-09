import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken; // Ambil refresh token dari cookie
    if (!refreshToken) {
      return res.sendStatus(401); // Unauthorized
    }

    // Cari user berdasarkan refresh token
    const user = await User.findOne({
      where: { refresh_token: refreshToken },
    });

    if (!user) {
      return res.sendStatus(403); // Forbidden
    }

    // Verifikasi refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err.message);
        return res.sendStatus(403); // Forbidden
      }

      const userId = user.id;
      const name = user.name;
      const email = user.email;

      // Buat access token baru (perbaiki typo ACCESS_TOKEN_SECRET)
      const accessToken = jwt.sign(
        { userId, name, email },
        process.env.ACCSESS_TOKEN_SECRET,
        { expiresIn: "15m" } // Token berlaku 15 menit
      );

      res.json({ accessToken }); // Kirim token baru
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.sendStatus(500); // Internal Server Error
  }
};
