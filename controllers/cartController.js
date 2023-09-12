const Product = require("../models/productSchema");
const CartItem = require("../models/cartSchema");
const User = require("../models/userSchema");

// Add To Cart Controller
exports.addToCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newCartItem = new CartItem({
      product: product._id,
      quantity: quantity || 1,
      size: "S",
    });

    await newCartItem.save();

    // Add the cart item to the user's cart array in the User model
    // console.log(req.user._id);
    const userId = req.user._id; // Assuming you're using authentication middleware
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { cart: newCartItem._id } },
      { new: true }
    );

    res.status(200).json({ message: "Product added to cart", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding product to cart" });
  }
};

// Fetch Cart Items Controller
exports.fetchCartItems = async (req, res) => {
  try {
    const requestedUserId = req.params.userId;

    const user = await User.findById(requestedUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all cart items belonging to the u ser
    const cartItems = await CartItem.find({
      _id: { $in: user.cart },
    }).populate("product");

    res.status(200).json({ cartItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching cart items" });
  }
};

// Remove Cart Items Controller
exports.removeCartItem = async (req, res) => {
  try {
    const cartItemId = req.params.cartItemId;

    // Delete the cart item
    await CartItem.findByIdAndDelete(cartItemId);

    // Remove the cart item from the user's cart array in the User model
    const userId = req.user._id; // Assuming you're using authentication middleware
    await User.findByIdAndUpdate(userId, {
      $pull: { cart: cartItemId },
    });

    res.status(200).json({ message: "Cart item removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing cart item" });
  }
};

// Update Cart Item Controller
exports.updatedCartItem = async (req, res) => {
  const { cartItemId } = req.params;
  const { newQuantity, newSize } = req.body;

  try {
    const updatedCartItem = await CartItem.findByIdAndUpdate(
      cartItemId,
      { quantity: newQuantity, size: newSize },
      { new: true }
    );
    res.json(updatedCartItem);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating cart item", error });
  }
};

