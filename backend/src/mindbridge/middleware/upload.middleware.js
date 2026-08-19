const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Ensure upload directories exist
['logos', 'csv'].forEach((sub) => {
  const dir = path.join(UPLOAD_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const CSV_MIMES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];

const isCsvFile = (file) =>
  path.extname(file.originalname).toLowerCase() === '.csv' && CSV_MIMES.includes(file.mimetype);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = isCsvFile(file)
      ? path.join(UPLOAD_DIR, 'csv')
      : path.join(UPLOAD_DIR, 'logos');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  // CSV uploads must have both a .csv extension and an allowlisted mimetype;
  // images must have an allowlisted image mimetype.
  if (IMAGE_MIMES.includes(file.mimetype) || isCsvFile(file)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP images and CSV files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
});

module.exports = { upload };
