const multer = require('multer');

const maxFileSize =
  Number(process.env.UPLOAD_MAX_BYTES) ||
  5 * 1024 * 1024;

const allowedMimeTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif']
]);

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(
      new Error('Only jpeg, png, webp, and gif images are allowed')
    );
  }

  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 1
  }
});

module.exports = upload;