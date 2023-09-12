const Product = require("../models/productSchema");
const User = require("../models/userSchema");
const CartItem = require("../models/cartSchema");
// Cleanup Cart Items Controller
const cleanUpCartItems = async (productId) => {
  try {
    // Remove cart items with the specified product reference
    await CartItem.deleteMany({ product: productId });
    console.log(`Cart items associated with product ${productId} cleaned up.`);
  } catch (error) {
    console.error(
      `Error cleaning up cart items for product ${productId}:`,
      error
    );
  }
};

// Create Product Controller
exports.productCreate = async (req, res) => {
  const { title, description, price, category, sizes } = req.body;

  try {
    const imageSrcs = req.files.map((file) => file.filename);

    // Split the comma-separated string into an array
    const sizesArray = sizes.split(",");
    console.log("sizes", sizesArray);
    // Creating a new product
    const newProduct = new Product({
      title,
      description,
      price,
      imageSrcs,
      sizes: sizesArray,
      category,
    });

    await newProduct.save();
    res.status(200).json({ message: "Product Created Successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating product" });
  }
};

// Fetch All Products Controller
exports.fetchAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching products" });
  }
};
// Filter Products Controller
exports.filterProducts = async (req, res) => {
  const {category} = req.params
  console.log(req.params)
  try {
    const filteredProducts = await Product.find({category});
    res.status(200).json({ filteredProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error filtering products" });
  }
};
// Update Product Controller
exports.productUpdate = async (req, res) => {
  const { productId } = req.params;
  const { title, description, price, imageSrcs, category, sizes } = req.body;

  try {
    const product = Product.findById(productId);
    if (product) {
      const updateProduct = await Product.findByIdAndUpdate(
        productId,
        { title, description, price, imageSrcs, category, sizes },
        { new: true }
      );
      res.json(updateProduct);
    } else {
      res.status(401).json({ message: "Product Not Found", error });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error });
  }
};

// Delete Product Controller
exports.productDelete = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (product) {
      // Delete the product
      await Product.findByIdAndDelete(productId);

      // Trigger the cleanup of associated cart items
      await cleanUpCartItems(productId);

      res.status(200).json({ message: "Product Deleted" });
    } else {
      res.status(400).json({ message: "Product Not Found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product" });
  }
};
