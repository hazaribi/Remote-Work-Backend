const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Workspace = require('../models/Workspace');

const router = express.Router();

// Generate invitation link
router.post('/generate', auth, async (req, res) => {
  try {
    const { workspaceId } = req.body;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const inviteCode = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await Workspace.createInvite(workspaceId, inviteCode, expiresAt);

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${inviteCode}`;
    
    res.json({ inviteLink, expiresAt });
  } catch (error) {
    console.error('Generate invite error:', error);
    res.status(500).json({ error: 'Failed to generate invite' });
  }
});

// Join workspace via invite
router.post('/join/:code', auth, async (req, res) => {
  try {
    const { code } = req.params;
    
    const invite = await Workspace.getInvite(code);
    if (!invite || new Date() > invite.expires_at) {
      return res.status(400).json({ error: 'Invalid or expired invite' });
    }

    const workspace = await Workspace.findById(invite.workspace_id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    await Workspace.addMember(invite.workspace_id, req.user.id);
    
    res.json({ 
      message: 'Successfully joined workspace',
      workspace: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description
      }
    });
  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(500).json({ error: 'Failed to join workspace' });
  }
});

// Get invite info (without joining)
router.get('/info/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const invite = await Workspace.getInvite(code);
    if (!invite || new Date() > invite.expires_at) {
      return res.status(400).json({ error: 'Invalid or expired invite' });
    }

    const workspace = await Workspace.findById(invite.workspace_id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json({
      workspace: {
        name: workspace.name,
        description: workspace.description
      },
      expiresAt: invite.expires_at
    });
  } catch (error) {
    console.error('Get invite info error:', error);
    res.status(500).json({ error: 'Failed to get invite info' });
  }
});

module.exports = router;