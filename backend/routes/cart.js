// routes/cart.js

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Therapist = require("../models/Therapist");

// Add to Cart
router.post("/", authenticate, async (req, res) => {
  try {
    const { profileId, therapies, date, timeslot, therapistId, mode } = req.body;
    const userId = req.user._id;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if profile is valid
    const isValidProfile = user.profiles.some(
      (p) => p._id.toString() === profileId
    );
    if (!isValidProfile) {
      return res.status(400).json({ message: "Invalid profile ID" });
    }

    // Check duplicates
    const existingItem = await Cart.findOne({
      userId,
      profileId,
      therapies,
      date,
      "timeslot.from": timeslot.from,
      "timeslot.to": timeslot.to,
    });
    if (existingItem) {
      return res
        .status(400)
        .json({ message: "Item already exists in the cart" });
    }

    const cartItem = new Cart({
      userId,
      profileId,
      therapies,
      date,
      timeslot,
      therapistId,
      mode: mode?.toUpperCase() || "ONLINE",
    });
    await cartItem.save();

    res.status(201).json({ message: "Item added to cart successfully!" });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
});

// Get Cart Items
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const cartItems = await Cart.find({ userId })
      .populate("therapies", "name cost")
      .lean();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const enhancedCartItems = await Promise.all(
      cartItems.map(async (item) => {
        const profile = user.profiles.find(
          (pr) => pr._id.toString() === item.profileId
        );

        let therapistDoc = null;
        if (item.therapistId) {
          therapistDoc = await Therapist.findById(item.therapistId).select(
            "name photo expertise about"
          );
        }

        return {
          ...item,
          profile: profile
            ? {
                name: profile.name,
                dateOfBirth: profile.dateOfBirth,
              }
            : null,
          therapist: therapistDoc
            ? {
                _id: therapistDoc._id,
                name: therapistDoc.name,
                photo: therapistDoc.photo,
                expertise: therapistDoc.expertise,
                about: therapistDoc.about,
              }
            : null,
        };
      })
    );

    res.status(200).json(enhancedCartItems);
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({
      message: "Failed to fetch cart items.",
      error: error.message,
    });
  }
});

// Delete single cart item
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deletedItem = await Cart.findOneAndDelete({ _id: id, userId });
    if (!deletedItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.status(200).json({ message: "Cart item deleted successfully!" });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res
      .status(500)
      .json({ message: "Failed to delete cart item.", error: error.message });
  }
});

// Clear entire cart
router.delete("/", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    await Cart.deleteMany({ userId });
    res.status(200).json({ message: "Cart cleared successfully!" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res
      .status(500)
      .json({ message: "Failed to clear cart.", error: error.message });
  }
});

module.exports = router;
