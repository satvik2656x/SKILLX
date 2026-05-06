require("dotenv").config();
const nodemailer = require("nodemailer");

// 🔹 Create transporter with better config
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔍 Verify connection (very useful for debugging)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Error:", error);
  } else {
    console.log("✅ SMTP Server is ready to send emails");
  }
});

module.exports = transporter;