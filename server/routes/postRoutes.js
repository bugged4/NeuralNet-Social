const express = require('express');

const {
  getPosts,
  getPost,
  createPost,
  deletePost
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getPosts)
  .post(protect, createPost);

router.route('/:id')
  .get(getPost)
  .delete(protect, deletePost);

module.exports = router;
