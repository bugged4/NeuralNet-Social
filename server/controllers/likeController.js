const asyncHandler = require('express-async-handler');

const Post = require('../models/Post');
const { formatPost } = require('./postController');

const toggleLikePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const existingLike = post.likes.find(
    (like) => like.user && like.user.toString() === req.user.id
  );

  let liked;

  if (existingLike) {
    post.likes = post.likes.filter(
      (like) => !like.user || like.user.toString() !== req.user.id
    );
    liked = false;
  } else {
    post.likes.push({
      user: req.user.id
    });
    liked = true;
  }

  post.likeCount = post.likes.length;
  await post.save();

  res.status(200).json({
    success: true,
    liked,
    post: formatPost(post)
  });
});

module.exports = {
  toggleLikePost
};
