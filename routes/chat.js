const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Workspace = require('../models/Workspace');
const auth = require('../middleware/auth');

// Get messages for workspace
router.get('/:workspaceId/messages', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Check if user is member
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.findByWorkspace(workspaceId);
    res.json({ messages });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send message
router.post('/:workspaceId/messages', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { content, messageType } = req.body;
    
    // Check if user is member
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await Message.create(content, workspaceId, req.user.id, messageType);
    
    // Emit to socket room
    req.app.get('io').to(`workspace_${workspaceId}`).emit('new_message', message);
    
    res.json({ message });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;