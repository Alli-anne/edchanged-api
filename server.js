const express = require('express');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authRoutes = require('./routes/auth');

const app = express();

const SCHOOL_DOMAINS = ['school.edu', 'another.edu'];

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// ── MongoDB ─────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ── Passport ────────────────────────────────────────────────
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
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ── Diagnostic route ─────────────────────────────────────────
// Visit http://localhost:5000/api/health to check what's working
app.get('/api/health', async (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = dbState[mongoose.connection.readyState];

  let userCount = null;
  let dbError = null;
  try {
    userCount = await User.countDocuments();
  } catch (err) {
    dbError = err.message;
  }

  res.json({
    server: 'ok',
    database: dbStatus,
    userCount,
    dbError,
    googleOAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    mongoUriSet: !!process.env.MONGO_URI,
    session: req.session ? 'ok' : 'missing',
    isAuthenticated: req.isAuthenticated(),
    loggedInUser: req.user ? { id: req.user._id, email: req.user.email } : null
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

app.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.send(`Logged in as ${req.user.email}`);
  }
);

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));