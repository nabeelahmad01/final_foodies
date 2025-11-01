// backend/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

/**
 * Configure and return Cloudinary instance
 * @returns {import('cloudinary').UploadApiResponse}
 */
const configureCloudinary = () => {
  // Check for required environment variables
  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required Cloudinary environment variables: ${missingVars.join(', ')}`);
  }

  // Configure Cloudinary
  const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  };

  // Configure Cloudinary with the provided config
  cloudinary.config(cloudinaryConfig);
  
  console.log('Cloudinary configured successfully');
  return cloudinary;
};

// Export the configuration function
export default configureCloudinary;
