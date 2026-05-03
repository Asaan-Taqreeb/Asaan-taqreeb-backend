const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Delete an image from Cloudinary by its URL or Public ID
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { imageUrl, publicId } = req.body;

    let idToDelete = publicId;

    // If only URL is provided, try to extract the public_id
    if (!idToDelete && imageUrl) {
      // Cloudinary URL format: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id].[ext]
      const parts = imageUrl.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex !== -1) {
        // The part after 'upload' is either 'v[version]' or the 'public_id'
        let publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
        if (!publicIdWithExt) {
             // Fallback if version is missing
             publicIdWithExt = parts.slice(uploadIndex + 1).join('/');
        }
        // Remove the extension
        idToDelete = publicIdWithExt.split('.').slice(0, -1).join('.');
      }
    }

    if (!idToDelete) {
      return res.status(400).json({
        success: false,
        message: 'Could not determine the image Public ID for deletion.',
      });
    }

    console.log('Attempting to delete Cloudinary image:', idToDelete);

    // Fail-safe: If keys are missing, don't crash, just log and return success
    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY) {
      console.warn('Cloudinary keys missing! Skipping physical deletion but returning success to client.');
      return res.status(200).json({
        success: true,
        message: 'Image removed from app (Physical deletion skipped: No keys configured)',
      });
    }

    const result = await cloudinary.uploader.destroy(idToDelete);

    if (result.result !== 'ok') {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary deletion failed',
        details: result,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    next(error);
  }
};
