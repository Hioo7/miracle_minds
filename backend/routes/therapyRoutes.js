const express = require("express");
const Therapy = require("../models/Therapy");
const { authenticate, authorizeAdmin } = require("../middleware/authenticate");

const router = express.Router();

// Add a new therapy
router.post("/add", authenticate, authorizeAdmin, async (req, res) => {
  const { name, description, cost } = req.body;

  if (!name || !description || cost == null) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newTherapy = new Therapy({ name, description, cost });
    await newTherapy.save();
    res.status(201).json({ message: "Therapy added successfully", therapy: newTherapy });
  } catch (error) {
    console.error("Error adding therapy:", error);
    res.status(500).json({ message: "Failed to add therapy" });
  }
});

// Get all therapies
router.get("/", authenticate, async (req, res) => {
  try {
    const therapies = await Therapy.find();
    res.status(200).json(therapies);
  } catch (error) {
    console.error("Error fetching therapies:", error);
    res.status(500).json({ message: "Failed to fetch therapies" });
  }
});

// Update therapy
router.put("/update/:id", authenticate, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, cost } = req.body;

  if (!name || !description || cost == null) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const therapy = await Therapy.findByIdAndUpdate(
      id,
      { name, description, cost },
      { new: true }
    );
    if (!therapy) {
      return res.status(404).json({ message: "Therapy not found" });
    }
    res.status(200).json({ message: "Therapy updated successfully", therapy });
  } catch (error) {
    console.error("Error updating therapy:", error);
    res.status(500).json({ message: "Failed to update therapy" });
  }
});

// Delete therapy
router.delete("/delete/:id", authenticate, authorizeAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const therapy = await Therapy.findByIdAndDelete(id);
    if (!therapy) {
      return res.status(404).json({ message: "Therapy not found" });
    }
    res.status(200).json({ message: "Therapy deleted successfully" });
  } catch (error) {
    console.error("Error deleting therapy:", error);
    res.status(500).json({ message: "Failed to delete therapy" });
  }
});

module.exports = router;
