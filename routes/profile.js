const express = require('express');
const auth = require('../middleware/auth');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, profile_picture, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;