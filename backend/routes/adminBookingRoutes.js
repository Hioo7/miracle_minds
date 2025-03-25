// routes/adminBookingRoutes.js
const express = require("express");
const router = express.Router();
const { authenticate, authorizeAdmin } = require("../middleware/authenticate");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Therapy = require("../models/Therapy");
const Therapist = require("../models/Therapist");
const Timeslot = require("../models/Timeslot");
const dayjs = require("dayjs");

// 1) Get all upcoming bookings
router.get("/admin/upcoming", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const today = dayjs().format("YYYY-MM-DD");
    // Also ensure isCanceled: false so canceled bookings don’t appear
    const upcomingBookings = await Booking.find({
      date: { $gte: today },
      isCanceled: false,
    })
      .populate("userId", "name email")
      .populate("therapies", "name cost");

    res.status(200).json(upcomingBookings);
  } catch (error) {
    console.error("Error fetching upcoming bookings:", error);
    res.status(500).json({ message: "Server error fetching upcoming bookings" });
  }
});


// 2) Get all bookings (with optional filters)
router.get("/admin/all", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { therapyId, month, date, status, contact } = req.query;
    const filter = {};

    if (therapyId) {
      filter.therapies = therapyId;
    }
    if (month) {
      filter.date = { $regex: `^${month}` };
    }
    if (date) {
      filter.date = date;
    }
    if (status) {
      filter.status = status;
    }
    if (contact) {
      filter.$or = [
        { email: { $regex: contact, $options: "i" } },
        { phone: { $regex: contact, $options: "i" } },
      ];
    }

    // Optionally you might exclude canceled bookings if you want
    // filter.isCanceled = false;

    const bookings = await Booking.find(filter)
      .populate("userId", "name email")
      .populate("therapies", "name cost")
      .sort({ date: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ message: "Server error fetching all bookings" });
  }
});



// 3) Get single booking details
router.get("/admin/detail/:bookingId", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate("userId", "name email address role")
      .populate("therapies", "name cost");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking detail:", error);
    res.status(500).json({ message: "Server error fetching booking detail" });
  }
});

// 4) POST /manual-booking (create a booking for a childName by an admin)
router.post("/manual-booking", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const {
      childName,
      childDOB,
      therapies,
      date,
      timeslot,
      email,
      phone,
      therapistId,
      mode,
    } = req.body;

    if (
      !childName ||
      !childDOB ||
      !therapies ||
      !date ||
      !timeslot ||
      !email ||
      !phone ||
      !therapistId ||
      !mode
    ) {
      return res.status(400).json({
        message:
          "All fields (childName, childDOB, therapies, date, timeslot, email, phone, therapistId, mode) are required",
      });
    }

    // Check if timeslot is already booked for that therapist
    const existingBooking = await Booking.findOne({
      date,
      "timeslot.from": timeslot.from,
      "timeslot.to": timeslot.to,
      therapistId,
    });
    if (existingBooking) {
      return res
        .status(400)
        .json({ message: "Timeslot is already booked for this therapist" });
    }

    // If multiple therapies, consider summing costs
    const therapyDoc = await Therapy.findById(therapies[0]);
    const cost = therapyDoc ? therapyDoc.cost : 0;

    // fetch therapist name for storing in booking
    let foundTherapistName = "";
    const foundTherapist = await Therapist.findById(therapistId);
    if (foundTherapist) {
      foundTherapistName = foundTherapist.name;
    }

    const newBooking = new Booking({
      userId: req.user._id,
      profileId: childName,
      childDOB,
      therapies,
      date,
      timeslot,
      status: "PAID",
      email,
      phone,
      amountPaid: cost,
      therapistId,
      therapistName: foundTherapistName,
      mode,
    });

    await newBooking.save();
    res.status(201).json({ message: "Booking created successfully" });
  } catch (error) {
    console.error("Error creating manual booking:", error);
    res
      .status(500)
      .json({ message: "Server error creating booking" });
  }
});

// 5) GET /timeslots?date=YYYY-MM-DD&therapistId=...&mode=...&therapies=...
// Unified route for AdminCreateBooking, Reschedule, etc.
router.get("/timeslots", authenticate, async (req, res) => {
  try {
    const { date, therapistId, mode, therapies } = req.query;
    if (!date || !therapistId) {
      return res
        .status(400)
        .json({ message: "Date and therapistId are required" });
    }

    // 1) Fetch universal timeslots
    const doc = await Timeslot.findOne({ date });
    let universalSlots = doc ? doc.slots : [];

    // 2) Check therapist's availability
    const therapist = await Therapist.findById(therapistId);
    if (!therapist || !therapist.availability) {
      // no availability => all universalSlots get hasExpert=false
      const result = universalSlots.map((slot) => ({
        ...slot,
        hasExpert: false,
      }));
      return res.status(200).json(result);
    }

    const therapistAvail = therapist.availability.find((a) => a.date === date);
    if (!therapistAvail || !therapistAvail.slots?.length) {
      // no availability for that date
      const result = universalSlots.map((slot) => ({
        ...slot,
        hasExpert: false,
      }));
      return res.status(200).json(result);
    }

    // Mark each universal slot as hasExpert=true if fully covered by therapist's availability
    let intermediate = universalSlots.map((slot) => {
      const slotFrom = dayjs(`${date} ${slot.from}`, "YYYY-MM-DD HH:mm");
      const slotTo = dayjs(`${date} ${slot.to}`, "YYYY-MM-DD HH:mm");

      const hasExpert = therapistAvail.slots.some((s) => {
        const tFrom = dayjs(`${date} ${s.from}`, "YYYY-MM-DD HH:mm");
        const tTo = dayjs(`${date} ${s.to}`, "YYYY-MM-DD HH:mm");
        return tFrom.isSameOrBefore(slotFrom) && tTo.isSameOrAfter(slotTo);
      });

      return { ...slot, hasExpert };
    });

    // Find existing bookings => a slot that is already booked is not available
    const existingBookings = await Booking.find({
      date,
      therapistId,
      isCanceled: false,
    });

    const bookedSlotSet = new Set(
      existingBookings.map((b) => `${b.timeslot.from}-${b.timeslot.to}`)
    );

    // Approach B: keep them but set hasExpert=false if it's already booked
    intermediate = intermediate.map((slot) => {
      const slotKey = `${slot.from}-${slot.to}`;
      if (bookedSlotSet.has(slotKey)) {
        return { ...slot, hasExpert: false };
      }
      return slot;
    });

    res.status(200).json(intermediate);
  } catch (error) {
    console.error("Error fetching timeslots:", error);
    res
      .status(500)
      .json({ message: "Server error fetching timeslots" });
  }
});

// 6) GET /api/admin/manual-timeslots?date=YYYY-MM-DD (optional)
router.get("/manual-timeslots", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    const timeslotDoc = await Timeslot.findOne({ date });
    if (!timeslotDoc) {
      return res.json([]);
    }
    res.json(timeslotDoc.slots);
  } catch (error) {
    console.error("Error fetching manual timeslots:", error);
    res.status(500).json({ message: "Server error fetching timeslots" });
  }
});


router.patch("/admin/cancel/:bookingId", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.isCanceled) {
      return res.status(400).json({ message: "Booking is already canceled." });
    }

    // Mark it canceled
    booking.isCanceled = true;
    await booking.save();

    return res.status(200).json({ message: "Booking canceled successfully." });
  } catch (error) {
    console.error("Error canceling booking:", error);
    res
      .status(500)
      .json({ message: "Server error canceling booking." });
  }
});

module.exports = router;
