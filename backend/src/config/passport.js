const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const crypto = require('crypto');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://survey-management-platform-production.up.railway.app'
    : `http://localhost:${process.env.PORT || 5000}`);

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Debug logging to help troubleshoot profile data issues
        try {
          console.log('Google profile id:', profile.id);
          console.log('Google profile emails:', profile.emails);
          console.log('Google profile displayName:', profile.displayName);
        } catch (logErr) {
          // ignore logging errors
        }

        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) return done(new Error('No email found in Google profile'));

        // Try to find existing user
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          // Create a new user with a random password (OAuth users won't use it)
          const randomPassword = crypto.randomBytes(20).toString('hex');
          user = await User.create({
            name: profile.displayName || (profile.name && `${profile.name.givenName} ${profile.name.familyName}`) || 'Google User',
            email: email.toLowerCase(),
            password: randomPassword,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Debug: print callback URL to help with redirect URI mismatches
try {
  console.log('Google OAuth callback URL:', `${BACKEND_URL}/api/auth/google/callback`);
} catch (e) {
  // ignore
}

// Serialize/deserialize not used (sessionless JWT flow)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err));
});

module.exports = passport;
