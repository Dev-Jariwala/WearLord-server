const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  imageSrcs: {
    type: [String], // Define it as an array of strings
    required: true,
  },
  sizes: {
    type: [String], // Store available sizes as an array of strings
    required: true,
  },
  category: {
    type: String, // Store the category as a string
    required: true,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
