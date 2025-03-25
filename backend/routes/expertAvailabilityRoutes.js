// routes/expertAvailabilityRoutes.js
const express = require("express");
const router = express.Router();
const { authenticate, authorizeExpert } = require("../middleware/authenticate");
const Therapist = require("../models/Therapist");
const Timeslot = require("../models/Timeslot");

// GET /api/expert/availability?date=YYYY-MM-DD
router.get("/expert/availability", authenticate, authorizeExpert, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required." });
    const therapist = await Therapist.findOne({ userId: req.user._id });
    if (!therapist) return res.json([]);
    const entry = therapist.availability.find(item => item.date === date);
    return res.json(entry ? entry.slots : []);
  } catch (error) {
    console.error("Error fetching expert availability:", error);
    return res.status(500).json({ message: "Server error fetching availability." });
  }
});

// GET /api/expert/availability/month?year=YYYY&month=MM
router.get("/expert/availability/month", authenticate, authorizeExpert, async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ message: "Year and month are required." });
    const therapist = await Therapist.findOne({ userId: req.user._id });
    if (!therapist) return res.json({});
    const result = {};
    therapist.availability.forEach(entry => {
      const [entryYear, entryMonth] = entry.date.split("-");
      if (entryYear === year && entryMonth === month.padStart(2, "0")) {
        result[entry.date] = entry.slots;
      }
    });
    return res.json(result);
  } catch (error) {
    console.error("Error fetching monthly availability:", error);
    return res.status(500).json({ message: "Server error fetching monthly availability." });
  }
});

// POST /api/expert/availability
router.post("/expert/availability", authenticate, authorizeExpert, async (req, res) => {
  try {
    const { date, slots } = req.body;
    if (!date || !slots || !Array.isArray(slots)) {
      return res.status(400).json({ message: "Date and slots array are required." });
    }
    const validSlots = slots.filter(s => s && s.from && s.to);
    if (validSlots.length === 0) {
      return res.status(400).json({ message: "No valid timeslot entries provided." });
    }
    let therapist = await Therapist.findOne({ userId: req.user._id });
    if (!therapist) {
      therapist = new Therapist({ userId: req.user._id, availability: [] });
    }
    const existing = therapist.availability.find(item => item.date === date);
    if (existing) {
      existing.slots = validSlots;
    } else {
      therapist.availability.push({ date, slots: validSlots });
    }
    await therapist.save();

    // Update universal Timeslot document (if exists) by adding/removing expert's id
    let timeslotDoc = await Timeslot.findOne({ date });
    if (timeslotDoc) {
      timeslotDoc.slots = timeslotDoc.slots.map(slot => {
        const slotStr = `${slot.from}-${slot.to}`;
        const isSelected = validSlots.some(s => `${s.from}-${s.to}` === slotStr);
        if (isSelected) {
          if (!slot.available_experts) slot.available_experts = [];
          if (!slot.available_experts.includes(req.user._id)) {
            slot.available_experts.push(req.user._id);
          }
        } else {
          if (slot.available_experts) {
            slot.available_experts = slot.available_experts.filter(
              id => id.toString() !== req.user._id.toString()
            );
          }
        }
        return slot;
      });
      await timeslotDoc.save();
    }
    return res.status(200).json({ message: "Expert availability saved successfully." });
  } catch (error) {
    console.error("Error saving expert availability:", error);
    return res.status(500).json({ message: "Server error saving availability." });
  }
});

// POST /api/expert/availability/copy
router.post("/expert/availability/copy", authenticate, authorizeExpert, async (req, res) => {
  try {
    const { sourceDate, targetDates } = req.body;
    if (!sourceDate || !targetDates || !Array.isArray(targetDates) || targetDates.length === 0) {
      return res.status(400).json({ message: "Source date and target dates are required." });
    }
    const therapist = await Therapist.findOne({ userId: req.user._id });
    if (!therapist) return res.status(404).json({ message: "Expert profile not found." });
    const sourceEntry = therapist.availability.find(item => item.date === sourceDate);
    if (!sourceEntry) {
      return res.status(404).json({ message: "No availability found for the source date." });
    }
    targetDates.forEach(date => {
      const existing = therapist.availability.find(item => item.date === date);
      if (existing) {
        existing.slots = [...sourceEntry.slots];
      } else {
        therapist.availability.push({ date, slots: [...sourceEntry.slots] });
      }
    });
    await therapist.save();
    return res.status(200).json({ message: "Availability copied successfully." });
  } catch (error) {
    console.error("Error copying expert availability:", error);
    return res.status(500).json({ message: "Server error copying availability." });
  }
});

// POST /api/expert/availability/recurring
router.post("/expert/availability/recurring", authenticate, authorizeExpert, async (req, res) => {
  try {
    const { sourceDate, recurringDays } = req.body;
    if (!sourceDate || !recurringDays || !Array.isArray(recurringDays) || recurringDays.length === 0) {
      return res.status(400).json({ message: "Source date and recurring days are required." });
    }
    const therapist = await Therapist.findOne({ userId: req.user._id });
    if (!therapist) return res.status(404).json({ message: "Expert profile not found." });
    const sourceEntry = therapist.availability.find(item => item.date === sourceDate);
    if (!sourceEntry) {
      return res.status(404).json({ message: "No availability found for the source date." });
    }
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);
    const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayIndex = d.getDay();
      const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayIndex);
      if (recurringDays.includes(dayName)) {
        const dateStr = d.toISOString().split("T")[0];
        const existing = therapist.availability.find(item => item.date === dateStr);
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
