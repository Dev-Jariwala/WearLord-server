const passport = require("passport");
const bcrypt = require("bcrypt");
const User = require("../models/userSchema");
const LocalStrategy = require("../config/passport").LocalStrategy;
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");

// Read the email template file
const emailTemplateSource = fs.readFileSync(
  "registrationConfirmation.html",
  "utf8"
);

// Compile the template using Handlebars
const emailTemplate = handlebars.compile(emailTemplateSource);

// User Login Controller
exports.userLogin = async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Error:", err);
      return next(err);
    }
    if (!user) {
      console.log("Login failed:", info.message);
      return res.status(401).json({ message: info.message });
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Error:", err);
        return next(err);
      }
      // Inside your login route
      // Assuming 'user' contains the user data
      const userPayload = {
        username: user.username,
        role: user.role,
        userId: user._id,
      };
      const token = jwt.sign(userPayload, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });

      console.log("Login successful:", user.username);
      const sanitizedUser = {
        _id: user._id,
        username: user.username,
        admin: user.admin,
      };
      return res.json({
        message: "Logged in successfully",
        token: token,
      });
    });
  })(req, res, next);
};

// User Register Controller
exports.userRegister = async (req, res) => {
  const { username, email, password, cpassword, otp } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    if (password === cpassword) {
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        role: "user",
      });
      await newUser.save();

      // sending successfuly registerd gmail
      // now here we will send gmail to user of successful payment with order details

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
        subject: "Registration Confirmation - WearLord",
        html: emailTemplate({ username }),
      };
      // Send the email
      await transporter.sendMail(mailOptions);
      res.json({ message: "User registered successfully" });
    } else {
      res.json({ message: "Enter same passwords" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering user" });
  }
};

// User Logout Controller
exports.userLogout = (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out successfully" });
  });
};

// Validate Username before register
exports.validateUsername = async (req, res) => {
  console.log(req.params);
  const username = req.params.username;

  if (username.length >= 4 && !username.includes(" ")) {
    const userExist = await User.findOne({ username: username });
    if (userExist) {
      res.json({ message: "Username Already Used" });
    } else {
      res.json({ message: "Available" });
    }
  } else {
    res.json({ message: "Invalid" });
  }
};

// Validate Email before register
exports.validateEmail = async (req, res) => {
  console.log(req.params);
  const email = req.params.email;

  if (email) {
    const userExist = await User.findOne({ email: email });
    if (userExist) {
      res.json({ message: "Email already used" });
    } else {
      res.json({ message: "Available" });
    }
  } else {
    res.json({ message: "Email not provided" });
  }
};
// Function to generate a random OTP
function generateOTP() {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

// Function to send OTP to the user's email
exports.sendOTP = async (req, res) => {
  try {
    const email = req.body.email;

    // Generate a random OTP
    const otp = generateOTP();

    // Create a transporter object using your email service's SMTP settings
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    // Define email data
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent successfully", otp: otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending OTP" });
  }
};
