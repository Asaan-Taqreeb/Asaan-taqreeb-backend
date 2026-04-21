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
    // Extract file path from URL
    const url = new URL(imageUrl);
    const fileName = url.pathname.split('/').pop();
    const folder = url.pathname.split('/').slice(-2, -1)[0];
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
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
