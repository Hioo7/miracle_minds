// models/Cart.js

const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  profileId: {
    type: String,
    required: true,
  },
  therapies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapy",
      required: true,
    },
  ],
  date: { type: String, required: true },
  timeslot: {
    from: { type: String, required: true },
    to: { type: String, required: true },
  },
  // store an ObjectId referencing Therapist
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Therapist",
  },
  mode: {
    type: String,
    enum: ["ONLINE", "OFFLINE"],
    default: "ONLINE",
  },
});

module.exports = mongoose.model("Cart", cartSchema);
