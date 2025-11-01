// backend/middleware/upload.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
const uploadDir = path.join(process.cwd(), 'uploads');

if (!existsSync(uploadDir)) {
  await mkdir(uploadDir, { recursive: true });
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed.`
    );
    error.status = 400;
    cb(error, false);
  }
};

// Configure multer with error handling
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Error handling middleware
const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        status: 'error',
        message: err.message || 'Error uploading file',
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(500).json({
        status: 'error',
        message: err.message || 'Server error while uploading file',
        message: 'File upload failed',
      });
    }
    next();
  });
};

// Export the upload middleware
export { upload, handleUpload };
export default upload;
