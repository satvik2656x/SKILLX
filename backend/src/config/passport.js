require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../db/pool");
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        if (!email) return done(new Error("No email found from Google"), null);

        // Check if user exists
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        let user;

        if (result.rows.length === 0) {
          // New user -> register
          const role = email === "maiticmaitic@gmail.com" ? "admin" : "user";
          const insertRes = await pool.query(
            "INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *",
            [email, name, role]
          );
          user = insertRes.rows[0];
        } else {
          user = result.rows[0];
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
