require("dotenv").config(); // ✅ VERY IMPORTANT

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// 🔍 Debug (remove later)
console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback", // ✅ full URL (recommended)
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 🔹 Extract useful data
        const user = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          picture: profile.photos?.[0]?.value,
        };

        // 👉 Later: save to PostgreSQL here

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// 🔐 Session handling
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;