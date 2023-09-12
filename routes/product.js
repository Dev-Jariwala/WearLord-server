const express = require("express");
const router = express.Router();
const User = require("../models/userSchema");
const { isAuthenticated, isAdmin } = require("../controllers/authControllers");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const { v4: uuidv4 } = require("uuid"); // Import the UUID library
const {
  productCreate,
  fetchAllProducts,
  productUpdate,
  productDelete,
  filterProducts,
} = require("../controllers/productControllers");
const multer = require("multer");

// Function to generate a unique cart reference
function generateUniqueCartReference() {
  // Generate a UUID as a cart reference
  return uuidv4();
}

// Function to store the cart reference in the database
async function storeCartReferenceInDatabase(userId, cartReference) {
  try {
    // Find the user by userId and update the cartReference field
    await User.findByIdAndUpdate(userId, { cartReference: cartReference });

    console.log(
      `Cart reference ${cartReference} stored in the database for user ${userId}`
    );
  } catch (error) {
    console.error(`Error storing cart reference in the database: ${error}`);
    throw error;
  }
}
async function fetchCartDataFromDatabase(userId, cartReference) {
  try {
    const user = await User.findOne({
      _id: userId,
      cartReference: cartReference,
    }).populate({
      path: "cart",
      populate: {
        path: "product", // Populate the product details in the cart items
      },
    });

    if (user) {
      const cartItems = user.cart;
      console.log("cartItems", cartItems);
      // Now you have the user's cart items with product details populated.
      return cartItems;
    } else {
      console.log("no user", user);
      // Handle the case where the user or cart reference is not found.
    }
  } catch (error) {
    console.error(`Error fetching cart data from the database: ${error}`);
    throw error;
  }
}

// Products routes...

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../client/public/img/products");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });
// Create Product Route
router.post(
  "/create-product",
  isAdmin,
  upload.array("imageSrcs", 5), // Allow up to 5 files (adjust as needed)
  productCreate
);

// Fetch All Products Route
router.get("/fetch-allproducts", fetchAllProducts);

// Update Product Route
router.put("/update-product/:productId", isAdmin, productUpdate);

// Delete Product Route
router.delete("/delete-product/:productId", isAuthenticated, productDelete);

// filter products route
router.get("/filter-products/:category", filterProducts);

// Create Checkout Session
router.post("/create-checkout-session", async (req, res) => {
  // console.log("here");
  try {
    const { products: productsJSON, userId, mobileNumber } = req.body;
    const products = JSON.parse(productsJSON);
    console.log(products, userId);
    // Generate a unique cart reference or token and store it in your database
    const cartReference = generateUniqueCartReference(); // Implement this function

    // Store the cart reference in your database, associating it with the user's cart
    await storeCartReferenceInDatabase(userId, cartReference); // Implement this function
    const customer = await stripe.customers.create({
      metadata: {
        userId: userId,
        cartReference: cartReference, // Pass the cart reference
        mobileNumber: mobileNumber,
      },
    });
    console.log("mobile number", customer.metadata);
    const lineItems = products.map((p) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: p.product.title,
        },
        unit_amount: p.product.price * 100,
      },
      quantity: p.quantity,
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      shipping_address_collection: {
        allowed_countries: ["IN" /* Add other allowed countries */],
      },
      billing_address_collection: "required",
    });
    res.json({ id: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating checkout" });
  }
});
//
router.get("/success", async (req, res) => {
  try {
    // Retrieve the session ID from the query parameters
    const sessionID = req.query.session_id;

    // Retrieve the Checkout Session and customer information
    const session = await stripe.checkout.sessions.retrieve(sessionID);
    const customer = await stripe.customers.retrieve(session.customer);

    // Access the customer's metadata
    const metadata = customer.metadata;

    // Retrieve user ID and cart data from customer metadata
    const userId = metadata.userId;
    const cartReference = metadata.cartReference; // Retrieve the cart reference
    const mobileNumber = metadata.mobileNumber;
    // Fetch the actual cart data from your database using the cart reference
    const cart = await fetchCartDataFromDatabase(userId, cartReference); // Implement this function

    // Send customer, session and cart details as response
    res.status(200).json({
      customer,
      session,
      cart,
    });
  } catch (error) {
    // Handle any errors gracefully
    console.error(error);
    res.status(500).send("An error occurred.");
  }
});

module.exports = router;
