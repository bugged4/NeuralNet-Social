const asyncHandler = require('express-async-handler');

const { getRecommendedPosts } = require('../services/recommendationService');
const { formatPost } = require('./postController');

const getRecommendedPostsForUser = asyncHandler(async (req, res) => {
  const recommendations = await getRecommendedPosts({
    userId: req.user.id,
    page: req.query.page,
    limit: req.query.limit
  });

  res.status(200).json({
    success: true,
    recommendations: recommendations.items.map((item) => ({
      post: formatPost(item.post),
      score: item.score,
      reasons: item.reasons
    })),
    pageInfo: recommendations.pageInfo,
    signals: recommendations.signals
  });
});

module.exports = {
  getRecommendedPostsForUser
};
