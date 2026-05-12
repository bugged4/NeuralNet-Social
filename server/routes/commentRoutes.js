const express = require('express');
const { createComment, deleteComment, updateComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// POST /api/posts/:postId/comments - Create a comment
router.post('/', protect, createComment);

// DELETE /api/posts/:postId/comments/:commentId - Delete a comment
router.delete('/:commentId', protect, deleteComment);

// PUT /api/posts/:postId/comments/:commentId - Update a comment
router.put('/:commentId', protect, updateComment);

module.exports = router;
