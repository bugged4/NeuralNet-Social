const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    url: {
      type: String,
      required: true
    },

    fileType: {
      type: String,
      enum: ['image', 'video']
    },

    size: {
      type: Number
    },

    originalName: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Upload', uploadSchema);