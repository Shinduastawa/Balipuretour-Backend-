import jwt from "jsonwebtoken";
import Admin from "../models/AdminModel.js";
import logger from "../utils/logger.js";


export const verifyadmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  logger.info("Authorization Header:", authHeader); // Debug Header

  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    logger.info("Token tidak ditemukan");
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.ACCSESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      logger.info("Token tidak valid:", err);
      return res.sendStatus(403); // Forbidden
    }

    if (!decoded.adminId) {
      logger.error("adminId tidak ditemukan dalam token");
      return res.status(400).json({ msg: "Token tidak valid atau tidak berisi adminId" });
    }

    try {
      const admin = await Admin.findOne({
        where: { id_admin: decoded.adminId },
        attributes: ["id_admin", "email"],
      });

      if (!admin) {
        return res.status(404).json({ msg: "Admin tidak ditemukan" });
      }

      // ✅ Simpan ke req
      req.admin = admin;
      req.userId = decoded.adminId;
      req.user = { id: decoded.adminId };
      logger.info("Decoded Admin ID:", req.userId); // Debug User ID

      next();
    } catch (error) {
      ("Error mencari admin:", error);
      return res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
  });
};
