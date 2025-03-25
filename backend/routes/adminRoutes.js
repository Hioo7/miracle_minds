const express = require("express");
const User = require("../models/User");
const { authenticate, authorizeAdmin } = require("../middleware/authenticate");

const router = express.Router();

// Fetch all users
router.get("/users", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "name dateOfBirth address phone email role");
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

// Update user role
router.put("/users/:id/role", authenticate, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["GENERAL", "ADMIN"].includes(role)) {
    return res.status(400).json({ message: "Invalid role specified" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Role updated successfully", user });
  } catch (err) {
    console.error("Error updating user role:", err);
    res.status(500).json({ message: "Server error while updating role" });
  }
});

module.exports = router;
