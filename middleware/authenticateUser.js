import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("🔍 Authorization Header dari Frontend:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("⚠️ Tidak ada atau format Authorization salah!");
    return res.status(401).json({ message: "User tidak terautentikasi" });
  }

  const token = authHeader.split(" ")[1];
  console.log("🛠 Token Diterima:", token);

  try {
    jwt.verify(token, process.env.ACCSESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.error("❌ Token tidak valid:", err.message);
        return res.status(403).json({ message: "Token tidak valid" });
      }

      console.log("✅ Token berhasil diverifikasi:", decoded);

      if (!decoded.userId) {
        console.error("⚠️ Token tidak memiliki userId!");
        return res.status(403).json({ message: "Token tidak valid" });
      }

      req.user = decoded; // Simpan userId dari token ke req.user
      next();
    });
  } catch (error) {
    console.error("❌ JWT Error:", error.message);
    return res.status(403).json({ message: "Token tidak valid" });
  }
};
