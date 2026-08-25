const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: { type: String, required: true },
    // Tracked so dormant accounts can be identified for the retention policy
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
