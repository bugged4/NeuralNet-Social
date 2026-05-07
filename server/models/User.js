const { model, Schema } = require('mongoose');

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      unique: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    createdAt: {
      type: String,
      default: () => new Date().toISOString()
    }
  },
  {
    timestamps: true
  }
);

module.exports = model('User', userSchema);
