// services/uploadToCloudinary.js
import cloudinary from './cloudinary.js';

export const uploadPDFToCloudinary = async (localFilePath) => {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'raw',
      folder: 'invoices',
      use_filename: true,
    });

    return result.secure_url;
  } catch (err) {
    throw new Error('❌ Gagal upload ke Cloudinary: ' + err.message);
  }
};
