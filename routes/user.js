const express = require("express");
const router = express.Router();
const { isAuthenticated, authUser } = require("../controllers/authControllers");
const {
  userLogin,
  userRegister,
  userLogout,
  validateUsername,
  validateEmail,
  verifyNewUserEmail,
  sendOTP,
} = require("../controllers/userController");
const nodemailer = require("nodemailer");

// User Login Route
router.post("/login", userLogin);

// User Register Route
router.post("/register", userRegister);

// User Logout Route
router.get("/logout", isAuthenticated, userLogout);

// User Authenticate Route
router.get("/authenticate", authUser);

// User name available status route
router.get("/validateUsername/:username", validateUsername);

// User email available status route
router.get("/validateEmail/:email", validateEmail);

// Example verification endpoint
router.get("/sendotp", sendOTP);

module.exports = router;
