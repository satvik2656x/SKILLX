const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const pool = require('../db/pool');
const transporter = require('../config/mailer');
const auth = require('../middleware/auth');

const router = express.Router();

// ================= SEND OTP =================
router.post('/send-otp', async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  email = email.toLowerCase().trim();

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Check if user exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length === 0) {
      // Create user if not exists
      const role = email === "maiticmaitic@gmail.com" ? "admin" : "user";
      await pool.query(
        "INSERT INTO users (email, name, role, otp, otp_expiry) VALUES ($1, $2, $3, $4, $5)",
        [email, email.split('@')[0], role, otp, expiry]
      );
    } else {
      await pool.query(
        "UPDATE users SET otp = $1, otp_expiry = $2 WHERE email = $3",
        [otp, expiry, email]
      );
    }

    await transporter.sendMail({
      from: `"SKILLX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Login OTP for SKILLX",
      text: `Your OTP is: ${otp}. It expires in 5 minutes.`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error sending OTP' });
  }
});

// ================= VERIFY OTP =================
router.post('/verify-otp', async (req, res) => {
  let { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
  email = email.toLowerCase().trim();

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = result.rows[0];
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > new Date(user.otp_expiry)) return res.status(400).json({ message: 'OTP expired' });

    // Clear OTP
    await pool.query("UPDATE users SET otp = NULL, otp_expiry = NULL WHERE email = $1", [email]);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
});

// ================= GOOGLE OAUTH =================
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", passport.authenticate("google", { failureRedirect: process.env.FRONTEND_URL + "/login?error=true" }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}&role=${req.user.role}`);
  }
);

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, trust_score, credits, is_flagged, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
