const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const Workspace = require('../models/Workspace');
const auth = require('../middleware/auth');

// Get all documents
router.get('/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const documents = await Document.findByWorkspace(workspaceId);
    res.json(documents);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single document
router.get('/:workspaceId/document/:documentId', auth, async (req, res) => {
  try {
    const { workspaceId, documentId } = req.params;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const document = await Document.findById(documentId);
    res.json({ document });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create document
router.post('/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title } = req.body;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const document = await Document.create(title, workspaceId, req.user.id);
    res.json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update document
router.put('/:workspaceId/document/:documentId', auth, async (req, res) => {
  try {
    const { workspaceId, documentId } = req.params;
    const updates = req.body;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const document = await Document.update(documentId, updates);
    req.app.get('io').to(`workspace_${workspaceId}`).emit('document_updated', document);
    
    res.json({ document });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Save document snapshot
router.post('/:workspaceId/document/:documentId/snapshot', auth, async (req, res) => {
  try {
    const { workspaceId, documentId } = req.params;
    const { yjsState, content } = req.body;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const document = await Document.updateSnapshot(documentId, yjsState, content);
    res.json({ document });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete document
router.delete('/:workspaceId/document/:documentId', auth, async (req, res) => {
  try {
    const { workspaceId, documentId } = req.params;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const document = await Document.delete(documentId);
    req.app.get('io').to(`workspace_${workspaceId}`).emit('document_deleted', { id: documentId });
    
    res.json({ document });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;