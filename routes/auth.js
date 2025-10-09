const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    console.log('Signup attempt:', { email, full_name });

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await User.create({ email, password, full_name });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await User.validatePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;