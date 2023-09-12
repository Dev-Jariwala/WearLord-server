const express = require("express");
const router = express.Router();
const User = require("../models/userSchema");
const { isAuthenticated } = require("../controllers/authControllers");
const nodemailer = require("nodemailer");
const Order = require("../models/orderSchema");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_ENDPOINT;
const fs = require("fs");

// Read the email template file
const emailTemplate = fs.readFileSync("orderConfirmGmail.html", "utf8");

// Function to fetch cart data using the cart reference
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
      // console.log(cartItems);
      // Now you have the user's cart items with product details populated.
      return cartItems;
    } else {
      // Handle the case where the user or cart reference is not found.
    }
  } catch (error) {
    console.error(`Error fetching cart data from the database: ${error}`);
    throw error;
  }
}

router.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body, // Use rawBody from body-parser
        sig,
        endpointSecret
      );
      //   console.log("event:", event);
    } catch (err) {
      console.log(err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      // Payment was successful
      const session = event.data.object;
      const customerId = session.customer; // Replace with the actual customer ID

      // Fetch the customer object from Stripe
      const customer = await stripe.customers.retrieve(customerId);
      console.log("session", session);
      console.log("customer", customer);
      // Access the customer's metadata
      const metadata = customer.metadata;
      // console.log(metadata);
      // Retrieve user ID and cart data from session metadata
      const userId = metadata.userId;
      const cartReference = metadata.cartReference; // Retrieve the cart reference

      // Fetch the actual cart data from your database using the cart reference
      const cart = await fetchCartDataFromDatabase(userId, cartReference); // Implement this function
      // console.log(cart);
      // console.log(session.shipping_details);

      // Create a new order document and save it
      const newOrder = new Order({
        userId: userId,
        name: session.customer_details.name,
        email: session.customer_details.email,
        products: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          size: item.size,
        })),
        mobileNumber: metadata.mobileNumber,
        totalAmount: session.amount_total,
        shippingAddress: session.shipping_details.address,
        deliveryStatus: "Pending...",
      });

      try {
        const savedOrder = await newOrder.save();
        console.log(savedOrder);
        // Clear the user's cart by setting it to an empty array
        await User.findByIdAndUpdate(userId, { cart: [] });
        // Add the new order to the user's orders array
        await User.findByIdAndUpdate(
          userId,
          { $push: { orders: savedOrder._id } },
          { new: true }
        );

        // now here we will send gmail to user of successful payment with order details
        const email = session.customer_details.email;

        // Create a transporter object using your email service's SMTP settings
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
        });
        // Define email data
        // Define email data
        // Define email data
        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "Order Confirmation - Your Payment Was Successful",
          html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        /* Add your CSS styles here */
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
        }
        h1 {
          color: #333;
        }
        p {
          color: #555;
        }
        /* Add more styles as needed */
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Order Confirmation</h1>
        <p>Dear Customer,</p>
        <p>Thank you for your recent purchase on WearLord. We are pleased to inform you that your payment has been successfully processed, and your order is confirmed. Below are the details of your order:</p>
        <p><strong>Order Number:</strong> ${savedOrder._id}</p>
        <p><strong>Total Amount:</strong> ₹${(
          session.amount_total / 100
        ).toFixed(2)} INR</p>
        <h2>Order Details:</h2>
        <ul>
          ${cart
            .map(
              (item, index) => `
            <li>
              <strong>Product:</strong> ${item.product.title}<br>
              <strong>Quantity:</strong> ${item.quantity}<br>
              <strong>Size:</strong> ${item.size}<br>
              <strong>Price:</strong> ₹${item.product.price.toFixed(2)} INR each
            </li>
          `
            )
            .join("")}
        </ul>
        <p><strong>Shipping Address:</strong></p>
        <p>${session.shipping_details.address.line1}</p>
        <p>${session.shipping_details.address.line2 || ""}</p>
        <p>${session.shipping_details.address.city}, ${
            session.shipping_details.address.state
          } ${session.shipping_details.address.postal_code}</p>
        <p>${session.shipping_details.address.country}</p>
        <p>Please keep this email for your reference. Your order will be processed and shipped shortly. You will receive a separate email with tracking information once your order is dispatched.</p>
        <p>If you have any questions or need further assistance, please feel free to reply to this email.</p>
        <p>Thank you for choosing WearLord for your fashion needs!</p>
        <p>Sincerely,<br>The WearLord Team</p>
      </div>
    </body>
    </html>
  `,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ received: true });
        // console.log("Order saved:", savedOrder);
      } catch (error) {
        console.log(error);
        console.error("Error saving order:", error);
        res.status(500).json({ message: "error" });
      }
    }
  }
);

module.exports = router;
