const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * Upload a single file buffer to Cloudinary
 */
const uploadToCloudinary = async (file, folder = 'services') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `asaan-taqreeb/${folder}`,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const uploadMultipleImages = async (files, folder = 'services') => {
  const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
};

const deleteFromCloudinary = async (imageUrl) => {
  try {
    // Cloudinary URLs look like: 
    // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<folder>/<filename>.<ext>
    
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      console.warn('deleteFromCloudinary: Not a Cloudinary URL, skipping:', imageUrl);
      return true;
    }

    // Extract public_id: everything between '/upload/' and the file extension, skipping version part
    const segments = imageUrl.split('/');
    const uploadIndex = segments.indexOf('upload');
    
    if (uploadIndex === -1) {
      console.warn('deleteFromCloudinary: Malformed URL, skipping:', imageUrl);
      return true;
    }

    // Path after 'upload'
    let pathSegments = segments.slice(uploadIndex + 1);
    
    // Skip version segment (e.g. v12345678)
    if (pathSegments[0].startsWith('v') && !isNaN(pathSegments[0].substring(1))) {
      pathSegments = pathSegments.slice(1);
    }

    // Join remaining segments and strip extension
    const fullPath = pathSegments.join('/');
    const publicId = fullPath.substring(0, fullPath.lastIndexOf('.'));

    console.log(`Attempting to delete Cloudinary asset: ${publicId}`);
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Cloudinary delete error: ${result.result}`);
    }

    console.log(`Cloudinary image deleted successfully: ${publicId}`);
    return true;
  } catch (error) {
    console.error('deleteFromCloudinary failed:', error.message);
    // Don't throw if keys are missing in dev, just log
    if (error.message.includes('Must supply cloud_name')) {
      console.warn('Cloudinary keys missing, skipping physical file deletion.');
      return true;
    }
    throw error;
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
  uploadMultipleImages,
  deleteFromCloudinary,
};
