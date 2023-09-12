const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../controllers/authControllers");
const {
  fetchMyOrders,
  updateOrder,
  fetchAllOrders,
} = require("../controllers/orderControllers");

// Fetch My Order Route
router.get("/fetch-myorders/:userId", isAuthenticated, fetchMyOrders);

// PUT route to update deliveryStatus and deliveryEstimate
router.put("/update-order/:orderId", isAdmin, updateOrder);

// Fetch All Order Route
router.get("/fetch-allorders", isAdmin, fetchAllOrders);
module.exports = router;
