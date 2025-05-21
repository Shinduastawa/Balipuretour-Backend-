import express from "express";
import upload from "../middleware/upload.js";
import { getUser, Register, Login, Logout, UpdateUser, LoginGoogle, RegisterGoogle,  Verifyemail, uploadPhoto, handlePhotoUpload, verifyEmailNonfirebase } from "../controllers/User.js";
import { LoginAdmin, RegisterAdmin, getAdminProfile, refreshTokenAdmin} from "../controllers/Admin.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyadmin } from "../middleware/verifyadmin.js";
import { refreshToken } from "../controllers/RefreshToken.js";
import { createPackageTourWithGaleries, updatePackageTourWithGaleriesAndRundown, getTourById, getTourGallery, getTourRundown, getAllPackageTours, deleteSingleGalleryImage, deleteRundown,
  deleteProgramTourByIndex,
  deleteFacilityTourByIndex, createRundown, updateRundown} from "../controllers/PackageTour.js";
import { createCardDestination, updateCardDestination, deleteCardDestinationWithPackageTour, getCardDestinationById  } from "../controllers/CardDestination.js";
import { getAllCardDestinations } from "../controllers/CardDestination.js";
import { getGalleryImages } from "../controllers/CardDestination.js";
import { uploadGalleryImages, updateGalleryImages  } from "../controllers/Galeries.js";
import { createBooking , getUserBookings, getAllBookings, updateBookingStatusByAdmin, getBookingById, updateBookingStatus } from "../controllers/Booking.js";
import { createPayment, paymentNotification,  getTransactionDetail, getAllTransactions } from "../controllers/Payment.js";
import { authenticateUser } from "../middleware/authenticateUser.js"; // Pastikan import
import { getTransactionByBookingId, getLatestTransactionByUserId  } from "../controllers/Transaction.js";
import { authRole } from "../middleware/authRole.js";
import {
  getAllAvailableDates,
  getAvailableDatesByPackage,
  addAvailableDate,
  deleteAvailableDate,
  bookDate,
  getAvailableDatesSlot,
  updateAvailableDates,
  getBookedDates,
} from "../controllers/AvailableDatesController.js";


import {
  getTotalTransactions,
  getTotalUsers,
  getTotalRevenue,
  getActivePackageTours,
  getRecentBookings,
  getAllPackagesWithDates,

} from "../controllers/Dashboard.js";

import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "../controllers/InvoiceController.js"; // Import controller

import {
  addNotification,
  getNotifications,
  markAsRead,
  deleteInbox
} from "../controllers/InboxController.js";






// import { refreshToken } from "../controllers/RefreshToken.js";


const router = express.Router();
// router.get("/token", refreshToken);
//Admin
router.post("/admin", LoginAdmin);
router.get("/tokenAdmin", refreshTokenAdmin); // ✅ Tambahin ini
router.post('/register-admin', RegisterAdmin); // Register admin
router.get("/get-admin", verifyadmin, getAdminProfile); // ✅ Gunakan verifyadmin

router.post('/booking-tour', verifyToken, createBooking, async (req, res) => {
  console.log("Token diterima:", req.headers.authorization);
  console.log("Payload booking:", req.body);2
});
router.get("/getUserBooking", verifyToken, getUserBookings);
router.post("/create-payment", createPayment);
router.post("/midtrans-notification", paymentNotification);
router.get("/transaction/:order_id", getTransactionDetail); // ✅ Route untuk ambil detail transaksi


router.get("/getAllBookings", getAllBookings)

router.put("/booking/:id", updateBookingStatus);

router.put("/admin/updateBookingStatus/:id", updateBookingStatusByAdmin);

router.get("/transaction/booking/:id_booking", getTransactionByBookingId);

router.get("/booking/:id_booking", getBookingById);

router.get("/transaction/user/:userId", getLatestTransactionByUserId);


router.get("/packages/available-dates", getAllPackagesWithDates);


router.get("/transactions/total", getTotalTransactions);
router.get("/users/total", getTotalUsers);
router.get("/revenue/total", getTotalRevenue);
router.get("/packages/active", getActivePackageTours);
router.get("/bookings/recent", getRecentBookings);

router.post("/inbox", addNotification);
router.get("/inbox", getNotifications);
router.patch("/inbox/:id/read", markAsRead);
router.delete("/inbox/:id", deleteInbox);

router.post("/invoices", createInvoice); // Membuat Invoice
router.get("/invoices", getAllInvoices); // Mengambil Semua Invoice
router.get("/invoices/:id", getInvoiceById); // Mengambil Invoice berdasarkan ID
router.put("/invoices/:id", updateInvoice); // Memperbarui Invoice
router.delete("/invoices/:id", deleteInvoice); // Menghapus Invoic

router.delete("/gallery/:id", deleteSingleGalleryImage);

// 🔹 GET semua tanggal yang tersedia
router.get("/available-dates", getAllAvailableDates);

// 🔹 GET tanggal tersedia berdasarkan `id_package`
router.get("/available-dates/:id_package", getAvailableDatesByPackage);

// 🔹 GET tanggal tersedia berdasarkan `id_package`
router.get("/available-slot/:id_package", getAvailableDatesSlot);

// 🔹 POST tambah tanggal baru
router.post("/available-dates", addAvailableDate);

router.put("/available-dates-update", updateAvailableDates);

router.get("/booked-dates", getBookedDates);


// 🔹 DELETE hapus tanggal berdasarkan `id_date`
router.delete("/available-dates/:id_date", deleteAvailableDate);

// untuk status update avlible
router.post("/book-date", verifyToken, bookDate)

router.delete("/tour/rundown/:id", deleteRundown);
router.delete("/tour/:id_package/program/:index", deleteProgramTourByIndex);
router.delete("/tour/:id_package/facility/:index", deleteFacilityTourByIndex);
router.post("/tour/rundown", createRundown);
router.put("/tour/rundown/:id", updateRundown);

router.get("/getAllTransactions",  getAllTransactions);

// Get paket-tour
router.get("/get-packages", getAllPackageTours)
// kelola paket tour
router.post("/package-tour", upload.array("galeries", 10), (req, res, next) => {
  next();
}, createPackageTourWithGaleries);

// update paket tour
router.put("/package-tour-update/:id_package", updatePackageTourWithGaleriesAndRundown);

// kelola card tour
router.post("/card-tour", createCardDestination);
// update card tour
router.put("/card-destination-update/:id", updateCardDestination);

// Route untuk fetch data
router.get("/get-card-destinations", getAllCardDestinations);

// Get Crad Destination By id
router.get("/get-card-destination/:id", getCardDestinationById);

// Route untuk mengambil gambar galeri
router.get("/get-gallery-images", getGalleryImages);

// Route Update gambar
router.post("/upload-gallery",   uploadGalleryImages);

// Route Update gambar
router.put("/update-gallery/:id_package", updateGalleryImages); // Perhatikan nama parameternya

// Dalate Card Tour dan Package Tour
router.delete('/card-destination-dalate/:id', deleteCardDestinationWithPackageTour);

// get data paket tour

router.get("/package-tour/:id", getTourById);
router.get("/tour/gallery/:id", getTourGallery);
router.get("/tour/rundown/:id", getTourRundown);


router.get('/user', verifyToken, getUser);
router.post('/user-register', Register);
router.post('/login', Login);
router.put('/update', verifyToken, UpdateUser);
router.delete('/logout', Logout);
router.get('/token', refreshToken);
router.post("/upload-photo", uploadPhoto, handlePhotoUpload);

// Akses hanya untuk Admin
router.get("/admin", authRole(["admin"]), (req, res) => {
  res.json({ msg: "Halo Admin!" });
});
router.post("/registergoogle", RegisterGoogle);
router.post("/logingoogle", LoginGoogle);
router.post("/verify-email", Verifyemail);
router.get("/verifyEmailNonfirebase", verifyEmailNonfirebase);
// Akses hanya untuk User
router.get("/user", authRole(["user"]), (req, res) => {
  res.json({ msg: "Halo User!" });
});
export default router