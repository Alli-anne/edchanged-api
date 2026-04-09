const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  school: { type: String },
  isFree: { type: Boolean, default: false },
  role: { type: String, default: 'user' },
  oauthProvider: { type: String },
  oauthId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);