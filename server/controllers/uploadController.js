const asyncHandler = require('express-async-handler');

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Upload a file using multipart/form-data field "file"');
  }

  res.status(201).json({
    success: true,
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    }
  });
});

module.exports = {
  uploadImage
};
