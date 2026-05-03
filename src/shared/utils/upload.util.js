const multer = require('multer');
const supabase = require('../../config/supabase');
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

const uploadToSupabase = async (file, folder = 'services') => {
  try {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

const uploadMultipleImages = async (files, folder = 'services') => {
  const uploadPromises = files.map(file => uploadToSupabase(file, folder));
  return Promise.all(uploadPromises);
};

const deleteFromSupabase = async (imageUrl) => {
  try {
    // Supabase public URLs look like:
    // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<folder>/<file>
    const bucketName = process.env.SUPABASE_BUCKET;

    // Split on the fixed segment to extract everything after /public/
    const publicSegment = '/storage/v1/object/public/';
    const publicIndex = imageUrl.indexOf(publicSegment);

    if (publicIndex === -1) {
      console.warn('deleteFromSupabase: unrecognized URL format, skipping storage delete:', imageUrl);
      return true;
    }

    // After /public/ we have <bucket>/<path...>
    const afterPublic = imageUrl.substring(publicIndex + publicSegment.length);
    // Decode URL-encoded characters (e.g. %2F, %20)
    const afterPublicDecoded = decodeURIComponent(afterPublic);

    // Strip the bucket prefix (case-insensitive match)
    const bucketPrefix = bucketName + '/';
    const bucketPrefixLower = bucketPrefix.toLowerCase();
    const afterPublicLower = afterPublicDecoded.toLowerCase();

    let filePath;
    if (afterPublicDecoded.startsWith(bucketPrefix)) {
      filePath = afterPublicDecoded.substring(bucketPrefix.length);
    } else if (afterPublicLower.startsWith(bucketPrefixLower)) {
      filePath = afterPublicDecoded.substring(bucketPrefix.length);
    } else {
      // URL doesn't start with our bucket name — log and skip
      console.warn('deleteFromSupabase: URL bucket does not match env bucket, skipping:', imageUrl);
      return true;
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }

    return true;
  } catch (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

const deleteFromCloudinary = async (imageUrl) => {
  try {
    // Cloudinary URLs look like: 
    // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<folder>/<filename>.<ext>
    // Example: https://res.cloudinary.com/demo/image/upload/v12345/asaan-taqreeb/services/myimage.jpg
    
    if (!imageUrl.includes('cloudinary.com')) {
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

    // Usually segments[uploadIndex + 1] is 'v12345' or the folder
    // We want everything after 'vXXXX' segment or directly after 'upload' if no version
    let pathSegments = segments.slice(uploadIndex + 1);
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
    // Don't throw if keys are missing, just log
    if (error.message.includes('Must supply cloud_name')) {
      console.warn('Cloudinary keys missing, skipping physical file deletion.');
      return true;
    }
    throw error;
  }
};

module.exports = {
  upload,
  uploadToSupabase,
  uploadMultipleImages,
  deleteFromSupabase,
  deleteFromCloudinary,
};
