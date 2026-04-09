const express = require('express');
const router = express.Router();
const User = require('../models/user');

// For demonstration purposes, using email domain to decide free or paid
const SCHOOL_DOMAINS = ['school.edu', 'university.edu']; // add valid school domains

// OAuth login/register route
router.post('/oauth', async (req, res) => {
  const { name, email, oauthProvider, oauthId } = req.body;

  if (!email || !oauthProvider || !oauthId) {
    return res.status(400).json({ message: 'Missing required OAuth info' });
  }

  // Check if user exists
  let user = await User.findOne({ email });

  if (!user) {
    // Determine if user is eligible for free account
    const domain = email.split('@')[1];
    const isFree = SCHOOL_DOMAINS.includes(domain);

    user = new User({
      name,
      email,
      oauthProvider,
      oauthId,
      isFree,
      school: isFree ? domain : null
    });

    await user.save();
  }

  // Response
  res.json({
    message: 'User logged in',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isFree: user.isFree
    }
  });
});
app.get('/test-users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
