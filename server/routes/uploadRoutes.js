const express = require('express');

const { uploadImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

const cloudinary = require('cloudinary').v2;

router.get('/cloudinary-test', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();

    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

router.post('/', protect, upload.single('file'), uploadImage);

module.exports = router;
