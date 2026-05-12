const cloudinary = require('cloudinary').v2;
const asyncHandler = require('express-async-handler');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (req, res) => {
  console.log('UPLOAD HIT');
  console.log(req.file);
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(req.file.buffer);
  });

  res.status(201).json({
    success: true,
    file:{
      filename: result.public_id,
    url: result.secure_url,
    }
    
  });
} ;

module.exports = { uploadImage };