const express = require('express');
const router = express.Router();

const userPresence = new Map();

// Update user presence
router.post('/update', (req, res) => {
  const { userId, status } = req.body;
  userPresence.set(userId, { status, lastSeen: new Date() });
  res.json({ success: true });
});

// Get workspace users presence
router.get('/workspace/:workspaceId', (req, res) => {
  const users = Array.from(userPresence.entries()).map(([userId, data]) => ({
    userId,
    status: data.status,
    lastSeen: data.lastSeen
  }));
  res.json({ users });
});

module.exports = router;