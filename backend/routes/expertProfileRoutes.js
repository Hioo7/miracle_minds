// routes/expertProfileRoutes.js
const express = require("express");
const router = express.Router();
const { authenticate, authorizeExpert } = require("../middleware/authenticate");
const Therapist = require("../models/Therapist");

// GET expert profile
router.get("/expert/profile", authenticate, authorizeExpert, async (req, res) => {
  try {
    const profile = await Therapist.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: "Expert profile not found" });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching expert profile:", error);
    res.status(500).json({ message: "Server error fetching expert profile" });
  }
});

// POST create expert profile
router.post("/expert/profile", authenticate, authorizeExpert, async (req, res) => {
  try {
    const { name, expertise, about, photo, supportedModes } = req.body;
    const existingProfile = await Therapist.findOne({ userId: req.user._id });
    if (existingProfile) {
      return res.status(400).json({ message: "Expert profile already exists" });
    }

    const newProfile = new Therapist({
      userId: req.user._id,
      name,
      expertise,
      about,
      photo,
      // pass in the new field (array)
      supportedModes: supportedModes || ["ONLINE"],
    });
    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (error) {
    console.error("Error creating expert profile:", error);
    res.status(500).json({ message: "Server error creating expert profile" });
  }
});

// PUT update expert profile
router.put("/expert/profile", authenticate, authorizeExpert, async (req, res) => {
  try {
    const { name, expertise, about, photo, supportedModes } = req.body;
    const profile = await Therapist.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: "Expert profile not found" });
    }

    if (name) profile.name = name;
    if (expertise) profile.expertise = expertise;
    if (about) profile.about = about;
    if (photo) profile.photo = photo;
    if (supportedModes) profile.supportedModes = supportedModes;

    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error updating expert profile:", error);
    res.status(500).json({ message: "Server error updating expert profile" });
  }
});

module.exports = router;
