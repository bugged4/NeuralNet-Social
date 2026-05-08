const express = require('express');

const { getRecommendedPostsForUser } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/posts', protect, getRecommendedPostsForUser);

module.exports = router;
