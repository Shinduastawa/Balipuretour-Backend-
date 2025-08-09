import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  logger.info("Authorization Header:", authHeader); // Debug Header

  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    logger.info("❌ Token tidak ditemukan");
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.ACCSESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      logger.info("❌ Token tidak valid:", err);
      return res.sendStatus(403); // Forbidden
    }

    // Cek apakah ini admin atau user
    if (decoded.adminId) {
      req.userId = decoded.adminId;
      req.user = { id: decoded.adminId, role: "admin" };
      logger.info("✅ Login sebagai Admin - ID:", req.userId);
    } else if (decoded.userId) {
      req.userId = decoded.userId;
      req.user = { id: decoded.userId, role: "user" };
      logger.info("✅ Login sebagai User - ID:", req.userId);
    } else {
      logger.error("❌ Token tidak mengandung adminId atau userId");
      return res.status(400).json({ msg: "Token tidak valid" });
    }

    next();
  });
};

