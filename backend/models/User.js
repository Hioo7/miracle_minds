// models/User.js

const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
});

const userSchema = new mongoose.Schema({
  // Basic user fields
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  assessment: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },
  dateOfBirth: Date,
  address: String,

  // Role can be 'GENERAL', 'EXPERT', or 'ADMIN'
  role: {
    type: String,
    enum: ["ADMIN", "EXPERT", "GENERAL"],
    default: "GENERAL",
  },

  // If your user can have multiple child profiles
  profiles: [profileSchema],

  // For email verification
  isVerified: {
    type: Boolean,
    default: false,
  },

  // Optional: Distinguish top-level admin from sub-admin
   isSuperAdmin: {
     type: Boolean,
     default: false,
  },

  /**
   * Permissions array:
   * e.g. ["create-booking", "manage-users", "timeslot-manager", ...]
   * This is especially relevant if role === "ADMIN" but the user is a sub-admin with limited pages.
   */
  permissions: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("User", userSchema);
