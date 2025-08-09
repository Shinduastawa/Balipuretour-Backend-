import Admin from '../models/AdminModel.js';  // Impor default, bukan dengan nama `admin`
import bcryptjs from "bcryptjs";
import logger from "../utils/logger.js";

const updatePasswordHash = async () => {
  const admin = await Admin.findOne({ where: { email: 'AdminPTbalipure@gmail.com' } }); // Sesuaikan username admin

  if (admin) {
    // Hash password yang ada
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(admin.password, salt);

    // Update password yang sudah di-hash ke database
    await Admin.update({ password: hashedPassword }, { where: { email: 'AdminPTbalipure@gmail.com' } });
    logger.info("Password berhasil di-hash dan diperbarui.");
  } else {
    logger.info("Admin tidak ditemukan.");
  }
};

updatePasswordHash();
