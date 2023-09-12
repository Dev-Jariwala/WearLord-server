const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../controllers/authControllers");
const {
  addToCart,
  fetchCartItems,
  removeCartItem,
  updatedCartItem,
  updatedCartItemSize,
} = require("../controllers/cartController");
const { cleanUpCartItems } = require("../controllers/productControllers");

// Add to Cart Route
router.post("/add-to-cart/:productId", isAuthenticated, addToCart);

// Fetch Cart Items Route
router.get(
  "/fetch-cartItems/:userId",
  isAuthenticated,
  fetchCartItems
);

// Update Cart Item Quantity Route
router.put("/update-cartItem/:cartItemId", isAuthenticated, updatedCartItem);

// Delete Cart Item Route
router.delete("/remove-cartItem/:cartItemId", isAuthenticated, removeCartItem);

module.exports = router;
