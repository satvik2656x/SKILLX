const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Verification Failed:", error.message);
  } else {
    console.log("✅ SMTP Server is ready to take messages");
  }
});

module.exports = transporter;
