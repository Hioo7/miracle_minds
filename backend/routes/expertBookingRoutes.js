// routes/expertBookingRoutes.js
const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");

const Booking = require("../models/Booking");
const Therapist = require("../models/Therapist");
const { authenticate } = require("../middleware/authenticate");

/**
 * GET /api/expert/bookings/upcoming
 * - Find the Therapist doc by userId = req.user._id
 * - Then find Bookings where booking.therapistId = therapist._id AND date >= today
 */
router.get("/expert/bookings/upcoming", authenticate, async (req, res) => {
  try {
    // 1) find the therapist doc for this user
    const therapist = await Therapist.findOne({ userId: req.user._id });
    if (!therapist) {
      return res.status(404).json({ message: "Therapist profile not found." });
    }

    // 2) define "today"
    const todayStr = dayjs().format("YYYY-MM-DD");

    // 3) find all upcoming bookings for that therapist
    const upcomingBookings = await Booking.find({
      therapistId: therapist._id,
      date: { $gte: todayStr },
    })
      .populate("userId", "name email")   // if you want the client's name/email
      .populate("therapies")             // get therapy details
      .sort({ date: 1 });

    return res.status(200).json(upcomingBookings);
  } catch (error) {
    console.error("Error fetching expert upcoming bookings:", error);
    return res.status(500).json({
      message: "Server error fetching expert upcoming bookings",
      error: error.message,
    });
  }
});

router.get("/expert/bookings/past", authenticate, async (req, res) => {
    try {
      // 1) Find the Therapist doc by userId = req.user._id
      const therapist = await Therapist.findOne({ userId: req.user._id });
      if (!therapist) {
        return res.status(404).json({ message: "Therapist profile not found." });
      }
  
      // 2) Define "today"
      const todayStr = dayjs().format("YYYY-MM-DD");
  
      // 3) Query Bookings:
      //    - booking.therapistId = therapist._id
      //    - date < today => indicates "past" sessions
      const pastBookings = await Booking.find({
        therapistId: therapist._id,
        date: { $lt: todayStr },
      })
        .populate("userId", "name email") // if you want user info
        .populate("therapies")           // if you want therapy details
        .sort({ date: -1 });             // descending by date
  
      return res.status(200).json(pastBookings);
    } catch (error) {
      console.error("Error fetching expert past bookings:", error);
      return res.status(500).json({
        message: "Server error fetching expert past bookings",
        error: error.message,
      });
    }
  });

module.exports = router;
