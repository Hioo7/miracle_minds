// routes/bookingRoutes.js

const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Models
const Booking = require("../models/Booking");
const Timeslot = require("../models/Timeslot");
const Therapist = require("../models/Therapist");
const Therapy = require("../models/Therapy");
const Cart = require("../models/Cart");
const { authenticate, authorizeAdmin } = require("../middleware/authenticate");

/**
 * GET /api/bookings/timeslots?date=YYYY-MM-DD[&mode=ONLINE|OFFLINE&therapies=ID,ID...]
 * Returns universal timeslots. If mode & therapies are present, picks an available therapist at random
 * and returns { from, to, hasExpert, therapistId?, therapistName? } for each slot.
 */
router.get("/timeslots", authenticate, async (req, res) => {
  try {
    const { date, mode, therapies } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // 1) find universal slots
    const doc = await Timeslot.findOne({ date });
    const universalSlots = doc ? doc.slots : [];

    // If no mode or therapies => raw return
    if (!mode || !therapies) {
      const rawSlots = universalSlots.map((slot) => ({
        from: slot.from,
        to: slot.to,
        hasExpert: false,
      }));
      return res.status(200).json(rawSlots);
    }

    // parse therapy IDs
    const therapyIds = therapies.split(",");
    const therapyDocs = await Therapy.find({ _id: { $in: therapyIds } });
    const therapyNames = therapyDocs.map((td) => td.name);

    const allTherapists = await Therapist.find({}).lean();
    const result = [];

    for (const slot of universalSlots) {
      const slotFrom = dayjs(`${date} ${slot.from}`, "YYYY-MM-DD HH:mm");
      const slotTo = dayjs(`${date} ${slot.to}`, "YYYY-MM-DD HH:mm");
      if (!slotFrom.isValid() || !slotTo.isValid()) {
        result.push({ from: slot.from, to: slot.to, hasExpert: false });
        continue;
      }

      // find potential therapists
      let matchingTherapists = allTherapists.filter((expert) => {
        // must match mode
        if (!expert.supportedModes?.includes(mode.toUpperCase())) return false;

        // must have at least one matching therapy
        const hasTherapy = therapyNames.some((tn) =>
          expert.expertise.includes(tn)
        );
        if (!hasTherapy) return false;

        // coverage
        if (!expert.availability) return false;
        const availEntry = expert.availability.find((a) => a.date === date);
        if (!availEntry || !availEntry.slots?.length) return false;

        const covers = availEntry.slots.some((s) => {
          const tFrom = dayjs(`${date} ${s.from}`, "YYYY-MM-DD HH:mm");
          const tTo = dayjs(`${date} ${s.to}`, "YYYY-MM-DD HH:mm");
          return tFrom.isValid() && tTo.isValid()
            && tFrom.isSameOrBefore(slotFrom)
            && tTo.isSameOrAfter(slotTo);
        });
        return covers;
      });

      // conflict check: remove any therapist who already has a booking on date/ from-to
      for (let i = matchingTherapists.length - 1; i >= 0; i--) {
        const tDoc = matchingTherapists[i];
        const conflict = await Booking.findOne({
          therapistId: tDoc._id,
          date,
          "timeslot.from": slot.from,
          "timeslot.to": slot.to,
          isCanceled: false,
        });
        if (conflict) {
          matchingTherapists.splice(i, 1);
        }
      }

      // if none remain => hasExpert=false
      if (matchingTherapists.length === 0) {
        result.push({ from: slot.from, to: slot.to, hasExpert: false });
      } else {
        // pick one at random
        const randomIndex = Math.floor(
          Math.random() * matchingTherapists.length
        );
        const chosen = matchingTherapists[randomIndex];
        result.push({
          from: slot.from,
          to: slot.to,
          hasExpert: true,
          therapistId: chosen._id.toString(),
          therapistName: chosen.name,
        });
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching timeslots:", error);
    return res.status(500).json({ message: "Server error fetching timeslots" });
  }
});


/**
 * GET /admin-timeslots => same logic, if you want to keep them separate for admin usage
 */
router.get("/admin-timeslots", authenticate, async (req, res) => {
  try {
    const { date, mode, therapies } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const doc = await Timeslot.findOne({ date });
    let universalSlots = doc ? doc.slots : [];

    if (!mode || !therapies) {
      return res.status(200).json(universalSlots);
    }

    let therapyIds = [];
    if (Array.isArray(therapies)) {
      therapyIds = therapies;
    } else if (typeof therapies === "string") {
      therapyIds = therapies.split(",");
    }
    const therapyDocs = await Therapy.find({ _id: { $in: therapyIds } });
    const therapyNames = therapyDocs.map((td) => td.name);

    const allTherapists = await Therapist.find({}).lean();

    const result = [];
    for (const slot of universalSlots) {
      const slotFrom = dayjs(`${date} ${slot.from}`, "YYYY-MM-DD HH:mm");
      const slotTo = dayjs(`${date} ${slot.to}`, "YYYY-MM-DD HH:mm");
      if (!slotFrom.isValid() || !slotTo.isValid()) {
        result.push({ from: slot.from, to: slot.to, hasExpert: false });
        continue;
      }

      const anyExpert = allTherapists.some((expert) => {
        if (!expert.supportedModes?.includes(mode.toUpperCase())) return false;
        if (!expert.availability || !expert.expertise) return false;
        const avail = expert.availability.find((a) => a.date === date);
        if (!avail || !avail.slots?.length) return false;
        const covers = avail.slots.some((s) => {
          const tFrom = dayjs(`${date} ${s.from}`, "YYYY-MM-DD HH:mm");
          const tTo = dayjs(`${date} ${s.to}`, "YYYY-MM-DD HH:mm");
          if (!tFrom.isValid() || !tTo.isValid()) return false;
          return tFrom.isSameOrBefore(slotFrom) && tTo.isSameOrAfter(slotTo);
        });
        if (!covers) return false;
        const hasTherapy = therapyNames.some((tn) =>
          expert.expertise.includes(tn)
        );
        return hasTherapy;
      });

      result.push({ from: slot.from, to: slot.to, hasExpert: anyExpert });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching admin timeslots:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching timeslots" });
  }
});

/**
 * POST /admin-book
 * Admin manually creates a *Booking* (not cart). Immediately picks a therapist & finalizes the booking doc.
 */
router.post("/admin-book", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const {
      childName,
      childDOB,
      therapies,
      date,
      timeslot,
      email,
      phone,
      mode,
    } = req.body;

    // Basic validation
    if (
      !childName ||
      !childDOB ||
      !therapies ||
      !date ||
      !timeslot ||
      !email ||
      !phone ||
      !mode
    ) {
      return res.status(400).json({
        message:
          "All fields (childName, childDOB, therapies, date, timeslot, email, phone, mode) are required",
      });
    }

    // parse timeslot
    const reqFrom = dayjs(`${date} ${timeslot.from}`, "YYYY-MM-DD HH:mm");
    const reqTo = dayjs(`${date} ${timeslot.to}`, "YYYY-MM-DD HH:mm");
    if (!reqFrom.isValid() || !reqTo.isValid()) {
      return res
        .status(400)
        .json({ message: `Invalid timeslot: ${timeslot.from}-${timeslot.to}` });
    }

    // fetch therapy docs => get cost
    let therapyIds = Array.isArray(therapies) ? therapies : [therapies];
    const therapyDocs = await Therapy.find({ _id: { $in: therapyIds } });
    if (!therapyDocs.length) {
      return res.status(400).json({ message: "No valid therapies found" });
    }
    // Summation or just first cost
    const cost = therapyDocs.reduce((sum, t) => sum + (t.cost || 0), 0);
    const therapyNames = therapyDocs.map((t) => t.name);

    // find all therapists that match coverage + mode + expertise
    const allTherapists = await Therapist.find({}).lean();
    const matchingExperts = allTherapists.filter((expert) => {
      // mode
      if (!expert.supportedModes?.includes(mode.toUpperCase())) return false;
      // expertise
      const hasTherapy = therapyNames.some((tn) =>
        expert.expertise.includes(tn)
      );
      if (!hasTherapy) return false;
      // coverage
      const availEntry = expert.availability.find((a) => a.date === date);
      if (!availEntry || !availEntry.slots?.length) return false;
      const covers = availEntry.slots.some((s) => {
        const slotFrom = dayjs(`${date} ${s.from}`, "YYYY-MM-DD HH:mm");
        const slotTo = dayjs(`${date} ${s.to}`, "YYYY-MM-DD HH:mm");
        return slotFrom.isSameOrBefore(reqFrom) && slotTo.isSameOrAfter(reqTo);
      });
      return covers;
    });

    if (matchingExperts.length === 0) {
      return res.status(400).json({
        message: "No experts available for this date/time/mode/therapy.",
      });
    }

    // pick one at random
    const randomIndex = Math.floor(Math.random() * matchingExperts.length);
    const chosenExpert = matchingExperts[randomIndex];

    // check conflict with existing booking
    const conflict = await Booking.findOne({
      date,
      "timeslot.from": timeslot.from,
      "timeslot.to": timeslot.to,
      therapistId: chosenExpert._id,
    });
    if (conflict) {
      return res
        .status(400)
        .json({ message: "Timeslot is already booked for this therapist" });
    }

    // create the booking doc right away
    const newBooking = await Booking.create({
      userId: req.user._id, // the admin's user _id
      profileId: childName, // storing childName in profileId for manual booking
      childDOB,
      therapies: therapyIds,
      date,
      timeslot,
      mode: mode.toUpperCase(),
      therapistId: chosenExpert._id,
      therapistName: chosenExpert.name,
      email,
      phone,
      amountPaid: cost, // admin can mark as paid
      status: "PAID", // or "PENDING"
    });

    return res
      .status(201)
      .json({ message: "Booking created successfully", booking: newBooking });
  } catch (error) {
    console.error("Error admin booking therapy:", error);
    return res
      .status(500)
      .json({ message: "Server error while admin booking therapy" });
  }
});

/**
 * POST /api/bookings/book (User route)
 *  - Puts the chosen session into the user's CART, referencing therapistId
 */
router.post("/book", authenticate, async (req, res) => {
  try {
    const { therapies, date, timeslot, profileId, mode, therapistId } = req.body;
    if (!therapies || !date || !timeslot || !profileId || !mode) {
      return res.status(400).json({
        message:
          "All fields (therapies, date, timeslot, profileId, mode) are required",
      });
    }

    const userId = req.user._id;

    // duplicates in cart?
    const existingCartItem = await Cart.findOne({
      userId,
      profileId,
      therapies,
      date,
      "timeslot.from": timeslot.from,
      "timeslot.to": timeslot.to,
    });
    if (existingCartItem) {
      return res
        .status(400)
        .json({ message: "Item already exists in the cart" });
    }

    // parse timeslot
    const reqFrom = dayjs(`${date} ${timeslot.from}`, "YYYY-MM-DD HH:mm");
    const reqTo = dayjs(`${date} ${timeslot.to}`, "YYYY-MM-DD HH:mm");
    if (!reqFrom.isValid() || !reqTo.isValid()) {
      return res.status(400).json({
        message: `Invalid timeslot: ${timeslot.from}-${timeslot.to}`,
      });
    }

    // fetch therapy docs => ensure they exist
    const therapyDocs = await Therapy.find({ _id: { $in: therapies } });
    if (!therapyDocs.length) {
      return res.status(400).json({ message: "No valid therapies found" });
    }
    const therapyNames = therapyDocs.map((t) => t.name);

    // find all therapists that can cover
    const allTherapists = await Therapist.find({}).lean();
    const matchingExperts = allTherapists.filter((expert) => {
      if (!expert.supportedModes?.includes(mode.toUpperCase())) return false;
      if (!expert.availability || !expert.expertise) return false;

      const availEntry = expert.availability.find((a) => a.date === date);
      if (!availEntry || !availEntry.slots?.length) return false;
      const covers = availEntry.slots.some((s) => {
        const slotFrom = dayjs(`${date} ${s.from}`, "YYYY-MM-DD HH:mm");
        const slotTo = dayjs(`${date} ${s.to}`, "YYYY-MM-DD HH:mm");
        return slotFrom.isSameOrBefore(reqFrom) && slotTo.isSameOrAfter(reqTo);
      });
      if (!covers) return false;

      const hasTherapy = therapyNames.some((tn) =>
        expert.expertise.includes(tn)
      );
      return hasTherapy;
    });

    if (matchingExperts.length === 0) {
      return res.status(400).json({
        message: "No experts available for the selected timeslot/mode",
      });
    }

    let chosenExpert = null;
    if (therapistId) {
      // user provided a specific therapist => validate
      chosenExpert = matchingExperts.find(
        (exp) => exp._id.toString() === therapistId
      );
      if (!chosenExpert) {
        return res
          .status(400)
          .json({ message: "The chosen therapist cannot cover that slot." });
      }
    } else {
      // pick random
      const randomIndex = Math.floor(Math.random() * matchingExperts.length);
      chosenExpert = matchingExperts[randomIndex];
    }

    // store cart item with doc's ID
    const newCartItem = new Cart({
      userId,
      profileId,
      therapies,
      date,
      timeslot,
      mode: mode.toUpperCase(),
      therapistId: chosenExpert._id,
    });
    await newCartItem.save();

    return res.status(201).json({
      message: "Item added to cart successfully!",
      expert: chosenExpert,
    });
  } catch (error) {
    console.error("Error booking therapy:", error);
    return res
      .status(500)
      .json({ message: "Server error while booking therapy" });
  }
});

/**
 * GET /api/bookings/upcoming
 * Return user's upcoming bookings => .populate("therapies").populate("therapistId","name")
 */
router.get("/upcoming", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split("T")[0];

    const upcomingBookings = await Booking.find({
      userId,
      date: { $gte: today },
    })
      .populate("therapies")
      .populate("therapistId", "name")
      .sort({ date: 1 });

    return res.status(200).json(upcomingBookings);
  } catch (error) {
    console.error("Error fetching upcoming bookings:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching upcoming bookings" });
  }
});

/**
 * GET /api/bookings/all
 * Return all bookings for the user => can also populate therapistId
 */
router.get("/all", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const allBookings = await Booking.find({ userId })
      .populate("therapies")
      .populate("therapistId", "name")
      .sort({ date: -1 });
    return res.status(200).json(allBookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching all bookings" });
  }
});

/**
 * GET /api/bookings/:id => single booking detail
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId)
      .populate("therapies")
      .populate("therapistId", "name");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== "ADMIN")    {
      return res.status(403).json({ message: "Not authorized" });
    }
    return res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching booking" });
  }
});

/**
 * DELETE /api/bookings/:id => user can delete/cancel a booking if they'd like
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await Booking.findByIdAndDelete(bookingId);
    return res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res
      .status(500)
      .json({ message: "Server error deleting booking" });
  }
});

/**
 * POST /api/bookings/reschedule => admin can reschedule, doesn't change therapist
 */
router.post("/reschedule", authenticate , async (req, res) => {
  try {
    const { bookingId, date, timeslot } = req.body;
    if (!bookingId || !date || !timeslot) {
      return res
        .status(400)
        .json({ message: "bookingId, date, timeslot are required." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // do not allow changing therapist => keep booking.therapistId as is
    // check conflict => same therapist, same slot
    const conflict = await Booking.findOne({
      _id: { $ne: bookingId },
      therapistId: booking.therapistId,
      date,
      "timeslot.from": timeslot.from,
      "timeslot.to": timeslot.to,
      isCanceled: false,
    });

    if (conflict) {
      return res
        .status(400)
        .json({ message: "That timeslot is already booked for this therapist." });
    }

    // update date/timeslot
    booking.date = date;
    booking.timeslot = timeslot;
    await booking.save();

    return res
      .status(200)
      .json({ message: "Booking rescheduled successfully", booking });
  } catch (error) {
    console.error("Error rescheduling booking:", error);
    return res
      .status(500)
      .json({ message: "Server error rescheduling booking" });
  }
});

module.exports = router;
