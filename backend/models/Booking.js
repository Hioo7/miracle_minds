// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
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

  // NEW FIELDS
  mode: {
    type: String,
    enum: ["ONLINE", "OFFLINE"],
    default: "ONLINE",
  },
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Therapist",
  },
  therapistName: {
    type: String,
    default: "",
  },

  paymentId: { type: String },
  orderId: { type: String },
  signature: { type: String },
  amountPaid: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["PENDING", "PAID", "FAILED", "CANCELED", "REFUNDED"],
    default: "PENDING",
  },
  isCanceled: { type: Boolean, default: false },
  refundId: { type: String, default: "" },
  refundStatus: {
    type: String,
    enum: ["NONE", "INITIATED", "COMPLETED"],
    default: "NONE",
  },

  email: { type: String },
  phone: { type: String },
  reports: [
    {
      url: { type: String },
      key: { type: String },
    },
  ],
});

module.exports = mongoose.model("Booking", bookingSchema);
