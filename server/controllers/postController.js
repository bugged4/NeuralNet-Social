const asyncHandler = require('express-async-handler');

const Post = require('../models/Post');

const formatPost = (post) => ({
  id: post.id || post._id,
  body: post.body,
  username: post.username,
  user: post.user,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  comments: post.comments,
  likes: post.likes,
  image: post.image,
  tags: post.tags,
  likeCount: post.likeCount || post.likes.length,
  commentCount: post.commentCount || post.comments.length
});

const getPosts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Post.countDocuments()
  ]);

  res.status(200).json({
    success: true,
    posts: posts.map(formatPost),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  res.status(200).json({
    success: true,
    post: formatPost(post)
  });
});

const createPost = asyncHandler(async (req, res) => {
  const body = req.body.body ? req.body.body.trim() : '';
  const image = req.body.image ? req.body.image.trim() : '';
  const tags = Array.isArray(req.body.tags)
    ? req.body.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
    : [];

  if (!body) {
    res.status(400);
    throw new Error('Post body must not be empty');
  }

  const post = await Post.create({
    body,
    image,
    tags,
    user: req.user.id,
    username: req.user.username
  });

  res.status(201).json({
    success: true,
    post: formatPost(post)
  });
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (post.user.toString() !== req.user.id && post.username !== req.user.username) {
    res.status(403);
    throw new Error('Action not allowed');
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
});

module.exports = {
  getPosts,
  getPost,
  createPost,
  deletePost,
  formatPost
};
