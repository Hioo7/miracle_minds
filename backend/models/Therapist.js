// models/Therapist.js

const mongoose = require("mongoose");

/**
 * Sub-schema that defines a single date of availability
 * with one or more time ranges.
 */
const availabilitySchema = new mongoose.Schema({
  date: {
    type: String, // "YYYY-MM-DD"
    required: true,
  },
  slots: [
    {
      from: { type: String, required: true }, // "HH:mm" in 24-hour format
      to: { type: String, required: true },
    },
  ],
});

/**
 * The main Therapist schema:
 * - userId: links to the 'User' collection (1:1 with a user doc).
 * - name, expertise, photo, about: extra info about the therapist.
 * - supportedModes: an array that can have "ONLINE", "OFFLINE", or both.
 * - availability: an array of availabilitySchema entries, each with date + slots.
 */
const therapistSchema = new mongoose.Schema({
  // references the 'User' doc associated with this therapist
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true,
  },

  // Optional descriptive fields:
  name: {
    type: String,
    default: "",
  },
  expertise: {
    type: [String],
    default: [], // e.g. ["Speech Therapy","Occupational Therapy"]
  },
  photo: {
    type: String,
    default: "",
  },
  about: {
    type: String,
    default: "",
  },

  /**
   * supportedModes: This array can contain any of:
   *  "ONLINE", "OFFLINE"
   * If an expert can do both, store both. e.g. ["ONLINE","OFFLINE"]
   */
  supportedModes: {
    type: [String],
    default: ["ONLINE"], // or empty array if you prefer
    enum: ["ONLINE", "OFFLINE"], // valid values
  },

  // Availability array, each entry for a particular date
  availability: {
    type: [availabilitySchema],
    default: [],
  },
});

module.exports = mongoose.model("Therapist", therapistSchema);
