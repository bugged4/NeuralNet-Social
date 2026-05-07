const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const maxFileSize = Number(process.env.UPLOAD_MAX_BYTES) || 5 * 1024 * 1024;
const allowedMimeTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif']
]);

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = allowedMimeTypes.get(file.mimetype);
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    const error = new Error('Only jpeg, png, webp, and gif images are allowed');
    error.statusCode = 400;
    return cb(error);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 1
  }
});

module.exports = upload;
