// controllers/InboxController.js
import Inbox from "../models/InboxModel.js";

// ✅ Tambahkan Notifikasi
export const addNotification = async (req, res) => {
  try {
    const { type, message } = req.body;

    const newNotif = await Inbox.create({ type, message });
    res.status(201).json({ message: "Notifikasi berhasil dibuat", data: newNotif });
  } catch (error) {
    res.status(500).json({ message: "Gagal membuat notifikasi", error: error.message });
  }
};

// ✅ Ambil Semua Notifikasi (Terbaru di atas)
export const getNotifications = async (req, res) => {
  try {
    const inbox = await Inbox.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ data: inbox });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil notifikasi", error: error.message });
  }
};

// ✅ Tandai sebagai dibaca
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Inbox.findByPk(id);

    if (!notif) return res.status(404).json({ message: "Notifikasi tidak ditemukan" });

    notif.read = true;
    await notif.save();

    res.status(200).json({ message: "Notifikasi ditandai sebagai dibaca", data: notif });
  } catch (error) {
    res.status(500).json({ message: "Gagal update", error: error.message });
  }
};

// inbox.controller.js
export const deleteInbox = async (req, res) => {
  try {
    const id = req.params.id;
    await Inbox.destroy({ where: { id } });
    res.status(200).json({ message: "Notifikasi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus notifikasi", error });
  }
};
