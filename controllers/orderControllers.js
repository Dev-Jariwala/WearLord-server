const User = require("../models/userSchema");
const Order = require("../models/orderSchema");

// Fetch My Orders Controller
exports.fetchMyOrders = async (req, res) => {
  try {
    const requestedUserId = req.params.userId;

    const user = await User.findById(requestedUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all orders belonging to the user
    const orderItems = await Order.find({
      _id: { $in: user.orders },
    }).populate("products.product"); // Populate the product details in the order items

    res.status(200).json({ orderItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching order items" });
  }
};

// Update Order Controller
exports.updateOrder = async (req, res) => {
  const { deliveryStatus, deliveryEstimate } = req.body;
  const orderId = req.params.orderId;
  console.log(deliveryStatus);
  try {
    // Find the order by orderId
    const order = await Order.findById(orderId);
    console.log(order);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update the deliveryStatus and deliveryEstimate fields
    if (deliveryStatus) {
      order.deliveryStatus = deliveryStatus;
    }

    if (deliveryEstimate) {
      order.deliveryEstimate = deliveryEstimate;
    }

    // Save the updated order
    const updatedOrder = await order.save();
    console.log(updatedOrder);

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Error updating order" });
  }
};

// Fetch All Order Controller
exports.fetchAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching orders" });
  }
};
