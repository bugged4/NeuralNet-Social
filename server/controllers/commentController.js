const asyncHandler = require('express-async-handler');
const Post = require('../models/Post');

const createComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const { postId } = req.params;
  const userId = req.user.id;
  const username = req.user.username;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Comment text is required');
  }

  if (text.length > 500) {
    res.status(400);
    throw new Error('Comment must be 500 characters or less');
  }

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const newComment = {
    user: userId,
    username,
    text: text.trim()
  };

  post.comments.push(newComment);
  post.commentCount = post.comments.length;
  await post.save();

  const addedComment = post.comments[post.comments.length - 1];

  res.status(201).json({
    success: true,
    comment: {
      id: addedComment._id,
      user: addedComment.user,
      username: addedComment.username,
      text: addedComment.text,
      createdAt: addedComment.createdAt
    }
  });
});

const deleteComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.id;

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  if (comment.user.toString() !== userId && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You can only delete your own comments');
  }

  post.comments.pull(commentId);
  post.commentCount = post.comments.length;
  await post.save();

  res.status(200).json({
    success: true,
    message: 'Comment deleted'
  });
});

const updateComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const { postId, commentId } = req.params;
  const userId = req.user.id;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Comment text is required');
  }

  if (text.length > 500) {
    res.status(400);
    throw new Error('Comment must be 500 characters or less');
  }

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  if (comment.user.toString() !== userId && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You can only edit your own comments');
  }

  comment.text = text.trim();
  await post.save();

  res.status(200).json({
    success: true,
    comment: {
      id: comment._id,
      user: comment.user,
      username: comment.username,
      text: comment.text,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    }
  });
});

module.exports = {
  createComment,
  deleteComment,
  updateComment
};
