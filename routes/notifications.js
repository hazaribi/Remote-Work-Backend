const express = require('express');
const router = express.Router();

const notifications = [];

// Create notification
router.post('/create', (req, res) => {
  const { userId, type, message, workspaceId } = req.body;
  const notification = {
    id: Date.now().toString(),
    userId,
    type,
    message,
    workspaceId,
    read: false,
    createdAt: new Date()
  };
  notifications.push(notification);
  res.json(notification);
});

// Get user notifications
router.get('/user/:userId', (req, res) => {
  const userNotifications = notifications.filter(n => n.userId === req.params.userId);
  res.json({ notifications: userNotifications });
});

// Mark as read
router.put('/:id/read', (req, res) => {
  const notification = notifications.find(n => n.id === req.params.id);
  if (notification) notification.read = true;
  res.json({ success: true });
});

// Send invite (simplified without email)
router.post('/invite', (req, res) => {
  const { email, workspaceId, inviterName } = req.body;
  
  // Create notification instead of sending email
  const notification = {
    id: Date.now().toString(),
    email,
    type: 'workspace_invite',
    message: `${inviterName} invited you to join workspace`,
    workspaceId,
    createdAt: new Date()
  };
  
  res.json({ success: true, notification });
});

module.exports = router;