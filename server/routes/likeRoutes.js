const express = require('express');

const { toggleLikePost } = require('../controllers/likeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

router.put('/like', protect, toggleLikePost);

module.exports = router;
