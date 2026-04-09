// server.js or your main file
const express = require('express');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const User = require('./models/user');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express(); // ⚡ You MUST define this first

// If you have a list of school domains
const SCHOOL_DOMAINS = ['school.edu', 'another.edu'];

// Middleware
app.use(express.json());
app.use(session({
  secret: 'some_secret', // use a strong secret in production
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const domain = email.split('@')[1];
    const isFree = SCHOOL_DOMAINS.includes(domain);

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email,
        oauthProvider: 'google',
        oauthId: profile.id,
        isFree,
        school: isFree ? domain : null
      });
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard'); // or wherever you want
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));