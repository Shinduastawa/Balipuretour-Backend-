import PackageTour from "../models/PackgeTourModel.js";
import Galeries from "../models/GaleriesModel.js";
import Rundown from "../models/RundownModel.js";
import AvailableDates from "../models/AvailableDatesModel.js";
import upload from "../middleware/uploadimg.js";
import fs from "fs";
import path from "path";
import Booking from "../models/BookingModel.js";
import logger from "../utils/logger.js";

// Get All Package  Touur
export const getAllPackageTours = async (req, res) => {
  try {
    const packages = await PackageTour.findAll(); // Ambil semua paket dari database
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data paket tour" });
  }
};




export const createPackageTourWithGaleries = async (req, res) => {
  try {
    // 1️⃣ Validasi data penting
    if (!req.body.package_name || !req.body.price_usd_2_5_person) {
      return res.status(400).json({ message: "Data tidak lengkap!" });
    }

    logger.info("📥 Data yang diterima:", req.body);

    // 2️⃣ Format program & fasilitas
    const programTour = Array.isArray(req.body.program_tour)
      ? req.body.program_tour.join(". ")
      : req.body.program_tour || "";

    const facilityTour = Array.isArray(req.body.facility_tour)
      ? req.body.facility_tour.join(". ")
      : req.body.facility_tour || "";

    // 3️⃣ Simpan data utama
    const newPackage = await PackageTour.create({
      package_name: req.body.package_name,
      about_package: req.body.about_package,
      program_tour: programTour,
      price_usd_2_5_person: req.body.price_usd_2_5_person,
      price_usd_6_10_person: req.body.price_usd_6_10_person,
      price_usd_11_15_person: req.body.price_usd_11_15_person,
      price_usd_16_20_person: req.body.price_usd_16_20_person,
      price_usd_21_person_up: req.body.price_usd_21_person_up,
      price_idr_2_5_person: req.body.price_idr_2_5_person,
      price_idr_6_10_person: req.body.price_idr_6_10_person,
      price_idr_11_15_person: req.body.price_idr_11_15_person,
      price_idr_16_20_person: req.body.price_idr_16_20_person,
      price_idr_21_person_up: req.body.price_idr_21_person_up,
      facility_tour: facilityTour,
      contact_pt: req.body.contact_pt,
    });

    const packageId = newPackage.id_package || newPackage.id;
    if (!packageId) return res.status(400).json({ message: "Gagal mendapatkan ID PackageTour" });

    logg("✅ ID Paket:", packageId);

    // 4️⃣ Buat folder galeri jika belum ada
    const galleryDir = path.join("public", `gallery_${packageId}`);
    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
    }

    let galeriesData = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const sanitizedName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
        const filename = `${Date.now()}_${sanitizedName}`;
        const filepath = path.join(galleryDir, filename);

        fs.writeFileSync(filepath, file.buffer); // ✅ simpan dari buffer
        galeriesData.push({
          id_package: packageId,
          img: `/gallery_${packageId}/${filename}`, // URL untuk frontend
        });
      }

      await Galeries.bulkCreate(galeriesData);
    }


    // 6️⃣ Simpan rundown
    let rundownData = [];
    if (req.body.Rundown) {
      const parsed = Array.isArray(req.body.Rundown)
        ? req.body.Rundown
        : JSON.parse(req.body.Rundown);

      rundownData = parsed.map((r) => ({
        id_package: packageId,
        day: r.day,
        time: r.time,
        description: r.description,
      }));

      await Rundown.bulkCreate(rundownData);
    }

    // 7️⃣ Kirim respons sukses
    res.status(201).json({
      message: "Paket tour berhasil disimpan!",
      data: newPackage,
      galeries: galeriesData,
      rundown: rundownData,
    });
  } catch (error) {
    logger.error("❌ Gagal simpan:", error);
    res.status(500).json({ message: "Terjadi kesalahan!", error: error.message });
  }
};






export const updatePackageTourWithGaleriesAndRundown = async (req, res) => {
  try {
    const packageId = req.params.id_package; // Pastikan ini dideklarasikan pertama
    if (!packageId) {
      return res.status(400).json({ message: "Gagal mendapatkan ID PackageTour" });
    }

    if (!req.body.package_name || !req.body.price_usd_2_5_person) {
      return res.status(400).json({ message: "Data tidak lengkap!" });
    }

    // Konversi program_tour & facility_tour agar selalu string
    const programTour = Array.isArray(req.body.program_tour)
      ? req.body.program_tour.join(". ")
      : req.body.program_tour || "";

    const facilityTour = Array.isArray(req.body.facility_tour)
      ? req.body.facility_tour.join(". ")
      : req.body.facility_tour || "";

    const updatedPackage = await PackageTour.update(
      {
        package_name: req.body.package_name,
        about_package: req.body.about_package,
        program_tour: programTour,
        price_usd_2_5_person: req.body.price_usd_2_5_person,
        price_usd_6_10_person: req.body.price_usd_6_10_person,
        price_usd_11_15_person: req.body.price_usd_11_15_person,
        price_usd_16_20_person: req.body.price_usd_16_20_person,
        price_usd_21_person_up: req.body.price_usd_21_person_up,
        facility_tour: facilityTour,
        contact_pt: req.body.contact_pt,
      },
      { where: { id_package: packageId } }
    );


    logg("Paket tour berhasil diperbarui:", updatedPackage);

    // **Update Galeri & Rundown jika ada**
    let galeriesData = [];
    if (Array.isArray(req.body.Galeries) && req.body.Galeries.length > 0) {
      if (req.body.Galeries.length > 10) {
        return res.status(400).json({ message: "Maksimal hanya bisa mengupload 10 gambar!" });
      }

      await Galeries.destroy({ where: { id_package: packageId } });

      galeriesData = req.body.Galeries.map((gallery) => ({
        id_package: packageId,
        img: gallery.image_url,
      }));

      await Galeries.bulkCreate(galeriesData);
    }

    let rundownData = [];
    if (Array.isArray(req.body.Rundown) && req.body.Rundown.length > 0) {
      await Rundown.destroy({ where: { id_package: packageId } });

      rundownData = req.body.Rundown.map((rundown) => ({
        id_package: packageId,
        day: rundown.day,
        time: rundown.time,
        description: rundown.description,
      }));

      await Rundown.bulkCreate(rundownData);
    }

    res.status(200).json({
      message: "Paket tour berhasil diperbarui dengan galeri dan rundown",
      data: updatedPackage,
      galeries: galeriesData,
      rundown: rundownData,
    });
  } catch (error) {
    logger.error("Error:", error);
    res.status(500).json({ message: "Gagal memperbarui paket tour", error: error.message });
  }
};

// Hapus satu gambar galeri berdasarkan ID
export const deleteSingleGalleryImage = async (req, res) => {
  const { id } = req.params;
  try {
    const image = await Galeries.findByPk(id);
    if (!image) return res.status(404).json({ message: "Gambar tidak ditemukan" });

    const imagePath = path.join("public", image.img);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath); // Hapus file lokal jika ada
    }

    await Galeries.destroy({ where: { id } });

    res.status(200).json({ message: "Gambar berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
  }
};





// **Delete PackageTour with Galeries and Rundown**
export const deletePackageTour = async (req, res) => {
  const { id_package } = req.params;

  try {
    const packageTour = await PackageTour.findByPk(id_package);
    if (!packageTour) return res.status(404).json({ message: "Paket tour tidak ditemukan" });

    await Galeries.destroy({ where: { id_package } });
    await Rundown.destroy({ where: { id_package } });
    await PackageTour.destroy({ where: { id: id_package } });

    res.status(200).json({ message: "Paket tour beserta galeri dan rundown berhasil dihapus" });
  } catch (error) {
    res.status(400).json({ message: "Gagal menghapus paket tour", error: error.message });
  }
};

// export const getTourById = async (req, res) => {
//   try {
//     const tour = await PackageTour.findByPk(req.params.id);
//     if (!tour) return res.status(404).json({ message: "Tour tidak ditemukan" });
//     res.json(tour);
//   } catch (error) {
//     res.status(500).json({ error: "Gagal mengambil data tour" });
//   }
// };

export const getTourById = async (req, res) => {
  try {
    logg("ID yang diminta:", req.params.id);
    const id = parseInt(req.params.id, 10); // pastikan jadi integer
    const tour = await PackageTour.findByPk(id);
    if (!tour) {
      logg("Tour tidak ditemukan");
      return res.status(404).json({ message: "Tour tidak ditemukan" });
    }
    res.json(tour);
  } catch (error) {
    logger.error("Error:", error);
    res.status(500).json({ error: "Gagal mengambil data tour" });
  }
};

export const getTourGallery = async (req, res) => {
  try {
    const gallery = await Galeries.findAll({ where: { id_package: req.params.id } });
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil galeri" });
  }
};

export const getTourRundown = async (req, res) => {
  try {
    const rundown = await Rundown.findAll({ where: { id_package: req.params.id } });
    res.json(rundown);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil rundown" });
  }
};

export const deleteRundown = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Rundown.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: "Rundown tidak ditemukan" });
    }

    res.status(200).json({ message: "Rundown berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus rundown", error: error.message });
  }
};

export const createRundown = async (req, res) => {
  try {
    const { time, description, id_package } = req.body;

    const newRundown = await Rundown.create({ time, description, id_package });

    res.status(201).json(newRundown);
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan rundown", error: error.message });
  }
};

export const updateRundown = async (req, res) => {
  const { id } = req.params;
  const { time, description } = req.body;

  try {
    const rundown = await Rundown.findByPk(id);
    if (!rundown) return res.status(404).json({ message: "Rundown tidak ditemukan" });

    rundown.time = time;
    rundown.description = description;
    await rundown.save();

    res.status(200).json({ message: "Rundown berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui rundown", error: error.message });
  }
};


// Hapus satu program tour berdasarkan ID (jika model terpisah)
export const deleteProgramTourByIndex = async (req, res) => {
  const { id_package, index } = req.params;

  try {
    const tour = await PackageTour.findByPk(id_package);
    if (!tour) return res.status(404).json({ message: "Paket tour tidak ditemukan" });

    let programs = tour.program_tour ? tour.program_tour.split(". ") : [];
    if (index < 0 || index >= programs.length) {
      return res.status(400).json({ message: "Index program tidak valid" });
    }

    // Hapus program berdasarkan index
    programs.splice(index, 1);
    tour.program_tour = programs.join(". ");
    await tour.save();

    res.status(200).json({ message: "Program tour berhasil dihapus", program_tour: tour.program_tour });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus program tour", error: error.message });
  }
};

// Hapus satu fasilitas tour berdasarkan ID (jika model terpisah)
export const deleteFacilityTourByIndex = async (req, res) => {
  const { id_package, index } = req.params;

  try {
    const tour = await PackageTour.findByPk(id_package);
    if (!tour) return res.status(404).json({ message: "Paket tour tidak ditemukan" });

    let facilities = tour.facility_tour ? tour.facility_tour.split(". ") : [];
    if (index < 0 || index >= facilities.length) {
      return res.status(400).json({ message: "Index fasilitas tidak valid" });
    }

    // Hapus fasilitas berdasarkan index
    facilities.splice(index, 1);
    tour.facility_tour = facilities.join(". ");
    await tour.save();

    res.status(200).json({ message: "Fasilitas tour berhasil dihapus", facility_tour: tour.facility_tour });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus fasilitas tour", error: error.message });
  }
};

export const deleteAvailableDateById = async (req, res) => {
  const { id_date } = req.params;

  try {
    const deleted = await AvailableDates.destroy({ where: { id_date } });
    if (deleted === 0) {
      return res.status(404).json({ message: "Available date tidak ditemukan" });
    }
    res.status(200).json({ message: "Available date berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus available date", error: error.message });
  }
};
