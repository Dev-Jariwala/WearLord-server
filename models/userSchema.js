const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, default: "user" },
  cart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CartItem",
    },
  ],
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // Reference to the order schema
    },
  ],
  cartReference: { type: String, required: false }, // Add this field to store the cart reference
});

// module.exports = mongoose.model("User", userSchema);
const User = mongoose.model("User", userSchema);

module.exports = User;
