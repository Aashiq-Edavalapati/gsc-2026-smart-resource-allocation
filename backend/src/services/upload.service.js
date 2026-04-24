import cloudinary from '../config/cloudinary.js';

export const uploadFile = async (filePath, resourceType = 'auto') => {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: resourceType, // image | video | auto
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    type: result.resource_type,
  };
};