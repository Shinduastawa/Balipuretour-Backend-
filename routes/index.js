import express from "express";
import upload from "../middleware/upload.js";
import logger from "../utils/logger.js";

import {
  getUser,
  Register,
  Login,
  Logout,
  UpdateUser,
  LoginGoogle,
  RegisterGoogle,
  Verifyemail,
  uploadPhoto,
  handlePhotoUpload,
  verifyEmailNonfirebase } from "../controllers/User.js";
import {
  LoginAdmin,
  RegisterAdmin,
  getAdminProfile,
  refreshTokenAdmin
} from "../controllers/Admin.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyadmin } from "../middleware/verifyadmin.js";
import { refreshToken } from "../controllers/RefreshToken.js";
import {
  createPackageTourWithGaleries,
  updatePackageTourWithGaleriesAndRundown,
  getTourById,
  getTourGallery,
  getTourRundown,
  getAllPackageTours,
  deleteSingleGalleryImage,
  deleteRundown,
  deleteProgramTourByIndex,
  deleteFacilityTourByIndex,
  createRundown,
  updateRundown,
  deleteAvailableDateById
} from "../controllers/PackageTour.js";
import {
  createCardDestination,
  updateCardDestination,
  deleteCardDestinationWithPackageTour,
  getCardDestinationById
} from "../controllers/CardDestination.js";
import { getAllCardDestinations } from "../controllers/CardDestination.js";
import { getGalleryImages } from "../controllers/CardDestination.js";
import { uploadGalleryImages, updateGalleryImages  } from "../controllers/Galeries.js";
import { createBooking , getUserBookings, getAllBookings, updateBookingStatusByAdmin, getBookingById, updateBookingStatus } from "../controllers/Booking.js";
import { createPayment, paymentNotification,  getTransactionDetail, getAllTransactions, getAllPaidTransactions } from "../controllers/Payment.js";
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
  getTodayTransactions,
  getTodayRevenue,
  getTodayBookings
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



const router = express.Router();
//Admin
router.post("/admin", LoginAdmin);
router.get("/tokenAdmin", refreshTokenAdmin);
router.post('/register-admin', RegisterAdmin);
router.get("/get-admin", verifyadmin, getAdminProfile);

router.post('/booking-tour', verifyToken, createBooking, async (req, res) => {
  logger.info("Token diterima:", req.headers.authorization);
  logger.info("Payload booking:", req.body);2
});
router.get("/getUserBooking", verifyToken, getUserBookings);
router.post("/create-payment", createPayment);
router.post("/midtrans-notification", paymentNotification);
router.get("/transaction/:order_id", getTransactionDetail); // ✅ Route untuk ambil detail transaksi
router.get("/transactions/paid", getAllPaidTransactions);
router.get("/getAllBookings", getAllBookings)
router.put("/booking/:id", updateBookingStatus);
router.put("/admin/updateBookingStatus/:id", updateBookingStatusByAdmin);
router.get("/transaction/booking/:id_booking", getTransactionByBookingId);
router.get("/booking/:id_booking", getBookingById);
router.get("/transaction/user/:userId", getLatestTransactionByUserId);
router.get("/packages/available-dates", getAllPackagesWithDates);
router.get('/transactions/today', getTodayTransactions);
router.get('/revenue/today', getTodayRevenue);
router.get('/bookings/today', getTodayBookings);
router.get("/transactions/total", getTotalTransactions);
router.get("/users/total", getTotalUsers);
router.get("/revenue/total", getTotalRevenue);
router.get("/packages/active", getActivePackageTours);
router.get("/bookings/recent", getRecentBookings);
router.post("/inbox", addNotification);
router.get("/inbox", getNotifications);
router.patch("/inbox/:id/read", markAsRead);
router.delete("/inbox/:id", deleteInbox);

// invoice
router.post("/invoices", createInvoice);
router.get("/invoices", getAllInvoices);
router.get("/invoices/:id", getInvoiceById);
router.put("/invoices/:id", updateInvoice);
router.delete("/invoices/:id", deleteInvoice);


// Avlible Date
router.get("/available-dates", getAllAvailableDates);
router.get("/available-dates/:id_package", getAvailableDatesByPackage);
router.get("/available-slot/:id_package", getAvailableDatesSlot);
router.post("/available-dates", addAvailableDate);
router.put("/available-dates-update", updateAvailableDates);
router.delete("/available-dates/:id_date", deleteAvailableDate);
router.delete("/available-dates/:id_date", deleteAvailableDateById);
router.get("/booked-dates", getBookedDates);
router.post("/book-date", verifyToken, bookDate)

// Rundwon
router.delete("/tour/rundown/:id", deleteRundown);
router.post("/tour/rundown", createRundown);
router.put("/tour/rundown/:id", updateRundown);
router.get("/tour/rundown/:id", getTourRundown);

// Program & Facility
router.delete("/tour/:id_package/program/:index", deleteProgramTourByIndex);
router.delete("/tour/:id_package/facility/:index", deleteFacilityTourByIndex);


router.get("/getAllTransactions",  getAllTransactions);

// Package Tour
router.get("/get-packages", getAllPackageTours)
router.post("/package-tour", upload.array("galeries", 10), createPackageTourWithGaleries);
router.put("/package-tour-update/:id_package", updatePackageTourWithGaleriesAndRundown);
router.get("/package-tour/:id", getTourById);

// kelola card tour
router.post("/card-tour", createCardDestination);
router.put("/card-destination-update/:id", updateCardDestination);
router.get("/get-card-destinations", getAllCardDestinations);
router.get("/get-card-destination/:id", getCardDestinationById);
router.delete('/card-destination-dalate/:id', deleteCardDestinationWithPackageTour);

// Route untuk mengambil gambar galeri
router.delete("/gallery/:id", deleteSingleGalleryImage);
router.get("/get-gallery-images", getGalleryImages);
router.post("/upload-gallery",   uploadGalleryImages);
router.put("/update-gallery/:id_package", updateGalleryImages);
router.get("/tour/gallery/:id", getTourGallery);

// get data paket tour
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