const multer = require('multer');
const supabase = require('../../config/supabase');

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

module.exports = {
  upload,
  uploadToSupabase,
  uploadMultipleImages,
  deleteFromSupabase,
};
