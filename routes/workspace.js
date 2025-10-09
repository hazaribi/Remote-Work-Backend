const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create workspace
router.post('/create', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const workspace = await Workspace.create(name, req.user.id);
    res.json({ workspace });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's workspaces
router.get('/my-workspaces', auth, async (req, res) => {
  try {
    const workspaces = await Workspace.findByUserId(req.user.id);
    res.json({ workspaces });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join workspace by ID
router.post('/join', auth, async (req, res) => {
  try {
    const { workspaceId } = req.body;
    console.log('Join workspace attempt:', { workspaceId, userId: req.user.id });
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }
    
    // Check if workspace exists
    try {
      const workspace = await Workspace.findById(workspaceId);
      console.log('Workspace found:', workspace ? 'Yes' : 'No');
    } catch (err) {
      console.log('Workspace not found:', err.message);
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    // Check if already a member
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    console.log('Is already member:', isMember);
    if (isMember) {
      return res.status(400).json({ error: 'Already a member of this workspace' });
    }

    console.log('Adding member to workspace...');
    await Workspace.addMember(workspaceId, req.user.id);
    const workspace = await Workspace.findById(workspaceId);
    console.log('Join successful');
    res.json({ workspace });
  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get workspace details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is member
    const isMember = await Workspace.isMember(id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const workspace = await Workspace.findById(id);
    res.json({ workspace });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;