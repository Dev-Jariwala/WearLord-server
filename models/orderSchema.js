const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Reference to the product schema
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      size: {
        type: String,
        enum: ["S", "M", "L", "XL"], // You can define possible values
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  shippingAddress: {
    // Define the structure for shipping address fields here
    // Example:
    city: String,
    country: String,
    line1: String,
    line2: String,
    state: String,
    postal_code: String,
    phone: String,
  },
  mobileNumber: { type: Number, required: true },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryStatus: {
    type: String, // You can use String to represent the delivery status
    enum: ["Pending...", "Processing...", "Shipped", "Delivered", "Canceled"], // You can define possible values
    default: "Pending...", // Set the default status as "Pending"
  },
  deliveryEstimate: {
    type: Date, // You can use a Date type for the delivery estimate
    required: false, // Set to true if you want the estimate to be mandatory
  },
});

module.exports = mongoose.model("Order", orderSchema);
