const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const transporter = require("../config/mailer");

// ================= REGISTER =================
exports.register = async (req, res) => {
  let { email, password } = req.body;

  // 🔹 Validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // 🔹 Normalize email
  email = email.toLowerCase().trim();

  try {
    // 🔹 Check if user exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 💾 Save user
    const result = await pool.query(
      "INSERT INTO users(email, password) VALUES($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );

    const user = result.rows[0];

    // 🎟️ Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 📩 Send email (non-blocking)
    transporter
      .sendMail({
        from: `"Auth App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome 🎉",
        html: `
          <h2>Welcome 🚀</h2>
          <p>Your account has been created successfully.</p>
        `,
        text: "Your account has been created successfully.",
      })
      .then(() => console.log("📧 Email sent"))
      .catch((err) =>
        console.error("❌ Email error:", err.message)
      );

    // ✅ Response
    res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  let { email, password } = req.body;

  // 🔹 Validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // 🔹 Normalize email
  email = email.toLowerCase().trim();

  try {
    // 🔍 Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];

    // 🔐 Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // 🎟️ Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ Response
    res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// ================= SEND OTP =================
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await pool.query(
      `
      INSERT INTO users(email, otp, otp_expiry)
      VALUES($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET otp=$2, otp_expiry=$3
      `,
      [email, otp, expiry]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    });

    res.json({ message: "OTP sent successfully 📩" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};


// ================= VERIFY OTP =================
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > user.otp_expiry) {
      return res.status(400).json({ error: "OTP expired" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful ✅",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};