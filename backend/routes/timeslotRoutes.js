const express = require("express");
const Timeslot = require("../models/Timeslot");
const { authenticate, authorizeAdmin } = require("../middleware/authenticate");

const router = express.Router();

// Get timeslots for a specific date
router.get("/timeslots", authenticate, async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  try {
    const timeslots = await Timeslot.findOne({ date });
    res.status(200).json(timeslots ? timeslots.slots : []);
  } catch (err) {
    console.error("Error fetching timeslots:", err);
    res.status(500).json({ message: "Server error while fetching timeslots" });
  }
});

// Save timeslots for a specific date
router.post("/timeslots", authenticate, authorizeAdmin, async (req, res) => {
  const { date, timeslots } = req.body;
  if (!date || !timeslots) {
    return res.status(400).json({ message: "Date and timeslots are required" });
  }

  try {
    let timeslotDoc = await Timeslot.findOne({ date });
    if (timeslotDoc) {
      timeslotDoc.slots = timeslots;
    } else {
      timeslotDoc = new Timeslot({ date, slots: timeslots });
    }

    await timeslotDoc.save();
    res.status(200).json({ message: "Timeslots saved successfully" });
  } catch (err) {
    console.error("Error saving timeslots:", err);
    res.status(500).json({ message: "Server error while saving timeslots" });
  }
});

// Copy timeslots to specific dates
router.post("/timeslots/copy", authenticate, authorizeAdmin, async (req, res) => {
  const { sourceDate, targetDates } = req.body;
  if (!sourceDate || !targetDates || targetDates.length === 0) {
    return res.status(400).json({ message: "Source date and target dates are required" });
  }

  try {
    const sourceTimeslot = await Timeslot.findOne({ date: sourceDate });
    if (!sourceTimeslot) {
      return res.status(404).json({ message: "Source timeslot not found" });
    }

    const copyPromises = targetDates.map(async (targetDate) => {
      let targetTimeslot = await Timeslot.findOne({ date: targetDate });
      if (targetTimeslot) {
        targetTimeslot.slots = sourceTimeslot.slots;
      } else {
        targetTimeslot = new Timeslot({ date: targetDate, slots: sourceTimeslot.slots });
      }
      await targetTimeslot.save();
    });

    await Promise.all(copyPromises);
    res.status(200).json({ message: "Timeslots copied successfully to selected dates" });
  } catch (err) {
    console.error("Error copying timeslots:", err);
    res.status(500).json({ message: "Server error while copying timeslots" });
  }
});

// Apply timeslots to recurring days
router.post("/timeslots/recurring", authenticate, authorizeAdmin, async (req, res) => {
  const { sourceDate, recurringDays } = req.body;
  if (!sourceDate || !recurringDays || recurringDays.length === 0) {
    return res.status(400).json({ message: "Source date and recurring days are required" });
  }

  try {
    const sourceTimeslot = await Timeslot.findOne({ date: sourceDate });
    if (!sourceTimeslot) {
      return res.status(404).json({ message: "Source timeslot not found" });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1); // Apply for one year

    const recurringPromises = [];
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      if (recurringDays.includes(dayName)) {
        const targetDate = date.toISOString().split("T")[0];
        recurringPromises.push(
          (async () => {
            let targetTimeslot = await Timeslot.findOne({ date: targetDate });
            if (targetTimeslot) {
              targetTimeslot.slots = sourceTimeslot.slots;
            } else {
              targetTimeslot = new Timeslot({ date: targetDate, slots: sourceTimeslot.slots });
            }
            await targetTimeslot.save();
          })()
        );
      }
    }

    await Promise.all(recurringPromises);
    res.status(200).json({ message: "Recurring timeslots applied successfully" });
  } catch (err) {
    console.error("Error applying recurring timeslots:", err);
    res.status(500).json({ message: "Server error while applying recurring timeslots" });
  }
});

module.exports = router;
