import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";


export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  logger.info("🔍 Authorization Header dari Frontend:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.error("⚠️ Tidak ada atau format Authorization salah!");
    return res.status(401).json({ message: "User tidak terautentikasi" });
  }

  const token = authHeader.split(" ")[1];
  logger.info("🛠 Token Diterima:", token);

  try {
    jwt.verify(token, process.env.ACCSESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        logger.error("❌ Token tidak valid:", err.message);
        return res.status(403).json({ message: "Token tidak valid" });
      }

      logger.info("✅ Token berhasil diverifikasi:", decoded);

      if (!decoded.userId) {
        logger.error("⚠️ Token tidak memiliki userId!");
        return res.status(403).json({ message: "Token tidak valid" });
      }

      req.user = decoded; // Simpan userId dari token ke req.user
      next();
    });
  } catch (error) {
    logger.error("❌ JWT Error:", error.message);
    return res.status(403).json({ message: "Token tidak valid" });
  }
};
