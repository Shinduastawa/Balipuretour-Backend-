import PackageTour from "../models/PackgeTourModel.js";
import Galeries from "../models/GaleriesModel.js";
import Rundown from "../models/RundownModel.js";
import upload from "../middleware/uploadimg.js";
import fs from "fs";
import path from "path";
import Booking from "../models/BookingModel.js";

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
    // Validasi Input
    if (!req.body.package_name || !req.body.price_usd_2_5_person) {
      return res.status(400).json({ message: "Data tidak lengkap!" });
    }

    // Log input body untuk debugging
    console.log("Data yang diterima di backend:", req.body);
    console.log("File yang diterima di backend:", req.files);

    // Konversi program_tour & facility_tour agar selalu string
    const programTour = Array.isArray(req.body.program_tour)
      ? req.body.program_tour.join(". ")
      : req.body.program_tour || "";

    const facilityTour = Array.isArray(req.body.facility_tour)
      ? req.body.facility_tour.join(". ")
      : req.body.facility_tour || "";

    // Simpan Data Paket Tour
    const newPackage = await PackageTour.create({
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
    });

    // Dapatkan ID Paket Tour
    const packageId = newPackage.id || newPackage.id_package;
    if (!packageId) {
      return res.status(400).json({ message: "Gagal mendapatkan ID PackageTour" });
    }

    console.log("ID Paket Tour yang baru disimpan:", packageId);

    // Nama Folder Dinamis
    const packageName = req.body.package_name.replace(/\s+/g, "_").toLowerCase();
    const folderPath = `/gallery_${packageName}`;

    // Simpan Galeri ke Database
    let galeriesData = [];
    if (req.files && req.files.length > 0) {
      galeriesData = req.files.map((file) => ({
        id_package: packageId,
        img: `${folderPath}/${file.filename}`,
      }));

      console.log("Galeri yang akan disimpan:", galeriesData);
      await Galeries.bulkCreate(galeriesData);
    }

    // Simpan Rundown ke Database
    let rundownData = [];
    if (req.body.Rundown) {
      const parsedRundown = Array.isArray(req.body.Rundown) ? req.body.Rundown : JSON.parse(req.body.Rundown);
      rundownData = parsedRundown.map((rundown) => ({
        id_package: packageId,
        day: rundown.day,
        time: rundown.time,
        description: rundown.description,
      }));

      console.log("Rundown yang akan disimpan:", rundownData);
      await Rundown.bulkCreate(rundownData);
    }

    // Kirimkan Response
    res.status(201).json({
      message: "Paket tour berhasil disimpan!",
      data: newPackage,
      galeries: galeriesData,
      rundown: rundownData,
    });
  } catch (error) {
    console.error("Error saat menyimpan data:", error);
    res.status(500).json({ message: "Terjadi kesalahan!", error: error.message });
  }
};





export const updatePackageTourWithGaleriesAndRundown = async (req, res) => {
  try {
    const packageId = req.params.id_package; // Pastikan ini dideklarasikan pertama
    if (!packageId) {
      return res.status(400).json({ message: "Gagal mendapatkan ID PackageTour" });
    }

    if (!req.body.package_name || !req.body.price_usd_2_5_person)  {
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


    console.log("Paket tour berhasil diperbarui:", updatedPackage);

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
    console.error("Error:", error);
    res.status(500).json({ message: "Gagal memperbarui paket tour", error: error.message });
  }
};

// Hapus satu gambar galeri berdasarkan ID
export const deleteSingleGalleryImage = async (req, res) => {
  const { id } = req.params;
  try {
    const image = await Galeries.findByPk(id);
    if (!image) return res.status(404).json({ message: "Gambar tidak ditemukan" });

    // Jika kamu menyimpan file secara lokal dan ingin menghapus fisik file-nya juga
    const imagePath = path.join("public", image.img);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath); // Hapus file dari storage lokal
    }

    await Galeries.destroy({ where: { id } });

    res.status(200).json({ message: "Gambar berhasil dihapus" });
  } catch (error) {
    console.error("Gagal hapus gambar:", error);
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
    console.log("ID yang diminta:", req.params.id);
    const id = parseInt(req.params.id, 10); // pastikan jadi integer
    const tour = await PackageTour.findByPk(id);
    if (!tour) {
      console.log("Tour tidak ditemukan");
      return res.status(404).json({ message: "Tour tidak ditemukan" });
    }
    res.json(tour);
  } catch (error) {
    console.error("Error:", error);
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