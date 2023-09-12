const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false, // Allow null values
  },
  quantity: {
    type: Number,
    default: 1,
  },
  size: {
    type: String,
    enum: ["S", "M", "L", "XL"], // You can define possible values
    required: true,
    default: "S",
  },
});

const CartItem = mongoose.model("CartItem", cartItemSchema);

module.exports = CartItem;
