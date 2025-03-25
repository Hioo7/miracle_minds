// routes/subAdminRoutes.js

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { authenticate, authorizeAdmin } = require("../middleware/authenticate");

/**
 * GET /api/admin/sub-admins
 * Returns all users with role=ADMIN who are *not* the “super admin”
 * (assuming super admin = the user who is calling, or some condition)
 */
router.get("/admin/sub-admins", authenticate, authorizeAdmin, async (req, res) => {
  try {
    // e.g. fetch all users with role=ADMIN
    const admins = await User.find({ role: "ADMIN" }).lean();

    // Optionally filter out "super admin" if you store that differently
    // For example, if super admin has some known email or user._id:
    // or store a separate field isSuperAdmin: true for the top-level admin.

    res.status(200).json(admins);
  } catch (error) {
    console.error("Error fetching sub-admins:", error);
    res.status(500).json({ message: "Failed to fetch sub-admins" });
  }
});

/**
 * POST /api/admin/sub-admins
 * Create a new sub-admin with certain permissions
 */


router.post("/admin/sub-admins", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, permissions } = req.body;

    // Basic checks
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Hash the password before storing it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with role=ADMIN and specified permissions
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword, // Store the hashed password
      role: "ADMIN",
      isVerified: true,
      permissions: permissions || [],
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating sub-admin:", error);
    res.status(500).json({ message: "Server error creating sub-admin" });
  }
});

/**
 * PUT /api/admin/sub-admins/:id
 * Update the sub-admin's permissions
 */
router.put("/admin/sub-admins/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Sub-admin user not found" });
    }
    if (user.role !== "ADMIN") {
      return res.status(400).json({ message: "User is not an admin" });
    }

    // Update the permissions
    user.permissions = permissions || [];
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating sub-admin:", error);
    res.status(500).json({ message: "Failed to update sub-admin" });
  }
});

/**
 * DELETE /api/admin/sub-admins/:id
 * Remove the sub-admin
 */
router.delete("/admin/deletesub-admins/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Sub-admin user not found" });
    }
    if (user.role !== "ADMIN") {
      return res.status(400).json({ message: "User is not an admin" });
    }

    // Ensure we are not deleting the super admin (Optional Check)
    if (user.isSuperAdmin) {
      return res.status(403).json({ message: "Cannot delete super admin" });
    }

    // Use findByIdAndDelete instead of remove()
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "Sub-admin deleted successfully" });
  } catch (error) {
    console.error("Error deleting sub-admin:", error);
    res.status(500).json({ message: "Server error deleting sub-admin" });
  }
});

router.put("/admin/sub-admins/change-password/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new passwords are required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Sub-admin user not found" });
    }

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});


module.exports = router;
