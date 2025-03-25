// models/Profile.js
const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  phone: { type: String },
});

module.exports = mongoose.model("Profile", ProfileSchema);
