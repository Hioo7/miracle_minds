// routes/therapistRoutes.js

const express = require("express");
const Therapist = require("../models/Therapist");
const { authenticate, authorizeAdmin } = require("../middleware/authenticate");

const router = express.Router();

// ====================== Base Therapist CRUD ======================

// Get all therapists
router.get("/therapists", authenticate, async (req, res) => {
  try {
    const therapists = await Therapist.find();
    res.status(200).json(therapists);
  } catch (error) {
    console.error("Error fetching therapists:", error);
    res.status(500).json({ message: "Server error while fetching therapists" });
  }
});

// Add a new therapist
router.post("/therapists", authenticate, authorizeAdmin, async (req, res) => {
  try {
    // Derive userId from the authenticated user
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ message: "No user ID found in token." });
    }

    const { name, expertise, about, photo, availability, supportedModes } = req.body;

    // Basic validation
    if (!name || !about || !photo || !Array.isArray(expertise)) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const newTherapist = new Therapist({
      userId,
      name,
      expertise,
      about,
      photo,
      availability,
      supportedModes,
    });

    await newTherapist.save();
    res.status(201).json({ message: "Therapist added successfully", therapist: newTherapist });
  } catch (error) {
    console.error("Error adding therapist:", error);
    res.status(500).json({ message: "Server error while adding therapist" });
  }
});

// Update an existing therapist
router.put("/therapists/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, expertise, about, photo, availability, supportedModes } = req.body;

    if (!name || !about || !photo || !Array.isArray(expertise)) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const updatedTherapist = await Therapist.findByIdAndUpdate(
      id,
      {
        name,
        expertise,
        about,
        photo,
        availability,
        supportedModes,
      },
      { new: true }
    );

    if (!updatedTherapist) {
      return res.status(404).json({ message: "Therapist not found" });
    }

    res.status(200).json({
      message: "Therapist updated successfully",
      therapist: updatedTherapist,
    });
  } catch (error) {
    console.error("Error updating therapist:", error);
    res.status(500).json({ message: "Server error while updating therapist" });
  }
});

// Delete a therapist
router.delete("/therapists/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTherapist = await Therapist.findByIdAndDelete(id);

    if (!deletedTherapist) {
      return res.status(404).json({ message: "Therapist not found" });
    }

    res.status(200).json({ message: "Therapist deleted successfully" });
  } catch (error) {
    console.error("Error deleting therapist:", error);
    res.status(500).json({ message: "Server error while deleting therapist" });
  }
});

// Get a single therapist by ID
router.get("/therapists/:id", authenticate, async (req, res) => {
  try {
    const therapistId = req.params.id;
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return res.status(404).json({ message: "Therapist not found" });
    }
    return res.status(200).json(therapist);
  } catch (error) {
    console.error("Error fetching therapist:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching therapist profile", error: error.message });
  }
});

// ====================== Availability Endpoints ======================

/**
 * GET /therapists/:id/availability?date=YYYY-MM-DD
 * Returns the slots for that specific date, or [] if none exist.
 */
router.get("/therapists/:id/availability", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date query param is required." });
    }

    const therapist = await Therapist.findById(id);
    if (!therapist) {
      return res.status(404).json({ message: "Therapist not found." });
    }

    // Find the availability entry for the given date
    const entry = therapist.availability.find((item) => item.date === date);
    if (entry) {
      return res.json(entry.slots || []);
    } else {
      return res.json([]);
    }
  } catch (error) {
    console.error("Error fetching therapist availability:", error);
    return res.status(500).json({ message: "Server error fetching availability." });
  }
});

/**
 * POST /therapists/:id/availability
 * Body: { date: "YYYY-MM-DD", slots: [{ from, to }, ...] }
 * Upserts the availability for that date with the given slots.
 */
router.post("/therapists/:id/availability", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, slots } = req.body;

    if (!date || !Array.isArray(slots)) {
      return res
        .status(400)
        .json({ message: "You must provide a 'date' and an array of 'slots'." });
    }

    // Validate timeslots
    const validSlots = slots.filter((s) => s && s.from && s.to);
    if (validSlots.length === 0) {
      return res.status(400).json({ message: "No valid timeslots provided." });
    }

    const therapist = await Therapist.findById(id);
    if (!therapist) {
      return res.status(404).json({ message: "Therapist not found." });
    }

    // Upsert availability for this date
    const existingEntry = therapist.availability.find((item) => item.date === date);
    if (existingEntry) {
      existingEntry.slots = validSlots;
    } else {
      therapist.availability.push({ date, slots: validSlots });
    }

    await therapist.save();
    return res.status(200).json({ message: "Therapist availability saved successfully." });
  } catch (error) {
    console.error("Error saving therapist availability:", error);
    return res.status(500).json({ message: "Server error saving availability." });
  }
});

/**
 * POST /therapists/:id/availability/copy
 * Body: { sourceDate: "YYYY-MM-DD", targetDates: ["YYYY-MM-DD", ...] }
 * Copies the timeslots from sourceDate to each target date.
 */
router.post("/therapists/:id/availability/copy", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { sourceDate, targetDates } = req.body;
    if (!sourceDate || !Array.isArray(targetDates) || targetDates.length === 0) {
      return res.status(400).json({ message: "Invalid sourceDate or targetDates array." });
    }

    const therapist = await Therapist.findById(id);
    if (!therapist) {
      return res.status(404).json({ message: "Therapist not found." });
    }

    // Find source entry
    const sourceEntry = therapist.availability.find((item) => item.date === sourceDate);
    if (!sourceEntry) {
      return res
        .status(404)
        .json({ message: "No availability found for the source date." });
    }

    // For each target date, upsert with the same slots
    targetDates.forEach((date) => {
      const existing = therapist.availability.find((item) => item.date === date);
      if (existing) {
        existing.slots = [...sourceEntry.slots];
      } else {
        therapist.availability.push({ date, slots: [...sourceEntry.slots] });
      }
    });

    await therapist.save();
    return res.status(200).json({ message: "Availability copied successfully." });
  } catch (error) {
    console.error("Error copying therapist availability:", error);
    return res.status(500).json({ message: "Server error copying availability." });
  }
});

/**
 * POST /therapists/:id/availability/recurring
 * Body: { sourceDate: "YYYY-MM-DD", recurringDays: ["Monday", "Tuesday", ...] }
 * Replicates the source date's timeslots to all matching weekdays for the next year.
 */
router.post("/therapists/:id/availability/recurring", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { sourceDate, recurringDays } = req.body;
    if (!sourceDate || !Array.isArray(recurringDays) || recurringDays.length === 0) {
      return res.status(400).json({ message: "Invalid sourceDate or recurringDays array." });
    }

    const therapist = await Therapist.findById(id);
    if (!therapist) {
      return res.status(404).json({ message: "Therapist not found." });
    }

    // Find source entry
    const sourceEntry = therapist.availability.find((item) => item.date === sourceDate);
    if (!sourceEntry) {
      return res
        .status(404)
        .json({ message: "No availability found for the source date." });
    }

    // Map weekday name -> index
    const dayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1); // replicate up to 1 year

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayIndex = d.getDay(); // 0-6
      // Find the day name by index
      const dayName = Object.keys(dayMap).find((key) => dayMap[key] === dayIndex);
      if (recurringDays.includes(dayName)) {
        const dateStr = d.toISOString().split("T")[0];
        // Upsert with sourceEntry.slots
        const existing = therapist.availability.find((item) => item.date === dateStr);
        if (existing) {
          existing.slots = [...sourceEntry.slots];
        } else {
          therapist.availability.push({ date: dateStr, slots: [...sourceEntry.slots] });
        }
      }
    }

    await therapist.save();
    return res.status(200).json({ message: "Recurring availability applied successfully." });
  } catch (error) {
    console.error("Error applying recurring availability:", error);
    return res.status(500).json({ message: "Server error applying recurring availability." });
  }
});

module.exports = router;
