const express = require("express");
const passport = require("passport");

const router = express.Router();

// Step 1: Go to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.send("Google Login Successful ✅");
  }
);

module.exports = router;