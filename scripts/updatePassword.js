import bcrypt from 'bcrypt';
import Admin from '../models/AdminModel.js';  // Impor default, bukan dengan nama `admin`


const updatePasswordHash = async () => {
  const admin = await Admin.findOne({ where: { user_name: 'admin' } }); // Sesuaikan username admin

  if (admin) {
    // Hash password yang ada
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(admin.password, salt);

    // Update password yang sudah di-hash ke database
    await Admin.update({ password: hashedPassword }, { where: { user_name: 'admin' } });
    console.log("Password berhasil di-hash dan diperbarui.");
  } else {
    console.log("Admin tidak ditemukan.");
  }
};

updatePasswordHash();
