import Booking from "./BookingModel.js";
import User from "./UserModel.js";
import PackageTour from "./PackgeTourModel.js";
import Payment from "./PaymentModel.js";
import CardDestination from "./CardDestinationModel.js";
import Galeries from "./GaleriesModel.js";
import Rundown from "./Rundown.js";

// Relasi Booking -> User
Booking.belongsTo(User, { foreignKey: "user_id", as: "User" });
User.hasMany(Booking, { foreignKey: "user_id", as: "Booking" });

// Relasi Booking dengan PackageTour (One-to-Many)
Booking.belongsTo(PackageTour, { foreignKey: "id_package", as: "Package" });
PackageTour.hasMany(Booking, { foreignKey: "id_package" });

// Relasi Booking dengan Payment (One-to-One)
Booking.belongsTo(Payment, { foreignKey: "id_payment", as: "Payment" });
Payment.hasOne(Booking, { foreignKey: "id_payment", as: "Booking" });

// Relasi CardDestination dengan PackageTour (Many-to-One)
CardDestination.belongsTo(PackageTour, { foreignKey: "id_package", as: "Package" });
PackageTour.hasMany(CardDestination, { foreignKey: "id_package", as: "CardDestination" });

// Relasi Galeries dengan PackageTour (One-to-One)
// Galeries.hasOne(PackageTour, { foreignKey: "id_galeries", as: "package" });
// PackageTour.belongsTo(Galeries, { foreignKey: "id_galeries", as: "galery" });

// Relasi Rundown dengan PackageTour (One-to-Many)
Rundown.belongsTo(PackageTour, { foreignKey: "id_package", as: "Package" });
PackageTour.hasMany(Rundown, { foreignKey: "id_package", as: "Rundown" });

// One-to-Many Relasi Galeries dengan PackageTour
PackageTour.hasMany(Galeries, { foreignKey: "id_package", as: "Galeries",});
Galeries.belongsTo(PackageTour, {foreignKey: "id_package",  as: "Package",});


// Menetapkan relasi One-to-One antara Payment dan Booking
Payment.belongsTo(Booking, { foreignKey: "id_booking", as: "Booking" });
Booking.hasOne(Payment, { foreignKey: "id_booking", as: "Payment" });
