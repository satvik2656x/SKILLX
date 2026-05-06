require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const transporter = require("./config/mailer");

const app = express();

// 🔹 Middlewares
app.use(cors());
app.use(express.json());

// 🔹 Session (for OAuth)
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// 🔹 Passport init
app.use(passport.initialize());
app.use(passport.session());

// 🔹 Routes
const authRoutes = require("./routes/authRoutes");
const googleAuthRoutes = require("./routes/googleAuth");
const authMiddleware = require("./middleware/authMiddleware"); // 🔐 NEW

app.use("/api/auth", authRoutes);
app.use("/auth", googleAuthRoutes);

// 🔹 Home route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});


// 🔐 🔥 PROTECTED ROUTE (IMPORTANT)
app.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed ✅",
    user: req.user,
  });
});


// 📩 TEST EMAIL ROUTE
app.get("/send-test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"Test App" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email 🚀",
      text: "Your SMTP is working successfully!",
    });

    res.send("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Email error:", error.message);
    res.status(500).send("Email failed");
  }
});

// 🔹 Server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});