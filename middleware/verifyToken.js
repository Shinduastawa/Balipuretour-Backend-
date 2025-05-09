import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log("Authorization Header:", authHeader); // Debug Header

  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    console.log("❌ Token tidak ditemukan");
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.ACCSESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log("❌ Token tidak valid:", err);
      return res.sendStatus(403); // Forbidden
    }

    // Cek apakah ini admin atau user
    if (decoded.adminId) {
      req.userId = decoded.adminId;
      req.user = { id: decoded.adminId, role: "admin" };
      console.log("✅ Login sebagai Admin - ID:", req.userId);
    } else if (decoded.userId) {
      req.userId = decoded.userId;
      req.user = { id: decoded.userId, role: "user" };
      console.log("✅ Login sebagai User - ID:", req.userId);
    } else {
      console.error("❌ Token tidak mengandung adminId atau userId");
      return res.status(400).json({ msg: "Token tidak valid" });
    }

    next();
  });
};

// import jwt from "jsonwebtoken";

// export const verifyToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   console.log("🔍 Authorization Header:", authHeader); // Debugging token

//   if (!authHeader) {
//     console.log("❌ Token tidak ditemukan di header!");
//     return res.status(401).json({ message: "User tidak terautentikasi" });
//   }

//   const token = authHeader.split(" ")[1];
//   if (!token) {
//     console.log("❌ Token kosong!");
//     return res.status(401).json({ message: "User tidak terautentikasi" });
//   }

//   jwt.verify(token, process.env.ACCSESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       console.log("❌ Token tidak valid:", err);
//       return res.status(403).json({ message: "Token tidak valid" });
//     }

//     console.log("✅ Token berhasil diverifikasi:", decoded);

//     req.user = { id: decoded.userId }; // Set user id ke req.user
//     next();
//   });
// };
