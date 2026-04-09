const express = require('express');
const router = express.Router();
const User = require('../models/user');

const SCHOOL_DOMAINS = ['school.edu', 'university.edu'];

// POST /api/auth/oauth
router.post('/oauth', async (req, res) => {
  const { name, email, oauthProvider, oauthId } = req.body;

  if (!email || !oauthProvider || !oauthId) {
    return res.status(400).json({ message: 'Missing required OAuth info' });
  }

  try {
    let user = await User.findOne({ email });

    if (!user) {
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

    res.json({
      message: 'User logged in',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isFree: user.isFree
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/auth/test-users  — see all users in the DB
router.get('/test-users', async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json({ count: users.length, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;