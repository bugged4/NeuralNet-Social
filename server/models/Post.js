const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {},
  {
    timestamps: true
  }
);

commentSchema.add({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  username: {
    type: String,
    required: true
  },

  text: {
    type: String,
    required: true,
    maxlength: 500
  },

  replies: [commentSchema]
});

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    username: {
      type: String,
      required: true
    },

    body: {
      type: String,
      required: true,
      maxlength: 2000
    },

    image: {
      type: String,
      default: ''
    },

    tags: [
      {
        type: String
      }
    ],

    likes: [likeSchema],

    comments: [commentSchema],

    likeCount: {
      type: Number,
      default: 0
    },

    commentCount: {
      type: Number,
      default: 0
    },

    isEdited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ tags: 1, createdAt: -1 });
postSchema.index({ body: 'text', username: 'text', tags: 'text' });

module.exports = mongoose.model('Post', postSchema);
