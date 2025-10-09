const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TaskList = require('../models/TaskList');
const Workspace = require('../models/Workspace');
const auth = require('../middleware/auth');

// Get task board (lists + tasks) for workspace
router.get('/:workspaceId/board', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    console.log('Loading task board for workspace:', workspaceId, 'user:', req.user.id);
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      console.log('Access denied - user not member of workspace');
      return res.status(403).json({ error: 'Access denied' });
    }

    const [lists, tasks] = await Promise.all([
      TaskList.findByWorkspace(workspaceId),
      Task.findByWorkspace(workspaceId)
    ]);

    console.log('Task board loaded:', lists.length, 'lists,', tasks.length, 'tasks');
    res.json({ lists, tasks });
  } catch (error) {
    console.error('Task board error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create task list
router.post('/:workspaceId/lists', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, position } = req.body;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const list = await TaskList.create(title, workspaceId, position);
    req.app.get('io').to(`workspace_${workspaceId}`).emit('list_created', list);
    
    res.json({ list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task list
router.put('/:workspaceId/lists/:listId', auth, async (req, res) => {
  try {
    const { workspaceId, listId } = req.params;
    const updates = req.body;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const list = await TaskList.update(listId, updates);
    req.app.get('io').to(`workspace_${workspaceId}`).emit('list_updated', list);
    
    res.json({ list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task list
router.delete('/:workspaceId/lists/:listId', auth, async (req, res) => {
  try {
    const { workspaceId, listId } = req.params;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const list = await TaskList.delete(listId);
    req.app.get('io').to(`workspace_${workspaceId}`).emit('list_deleted', { id: listId });
    
    res.json({ list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create task
router.post('/:workspaceId/tasks', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, listId, position } = req.body;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = await Task.create(title, description, listId, workspaceId, req.user.id, position);
    req.app.get('io').to(`workspace_${workspaceId}`).emit('task_created', task);
    
    res.json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task
router.put('/:workspaceId/tasks/:taskId', auth, async (req, res) => {
  try {
    const { workspaceId, taskId } = req.params;
    const updates = req.body;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = await Task.update(taskId, updates);
    req.app.get('io').to(`workspace_${workspaceId}`).emit('task_updated', task);
    
    res.json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task
router.delete('/:workspaceId/tasks/:taskId', auth, async (req, res) => {
  try {
    const { workspaceId, taskId } = req.params;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = await Task.delete(taskId);
    req.app.get('io').to(`workspace_${workspaceId}`).emit('task_deleted', { id: taskId });
    
    res.json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task positions (for drag and drop)
router.put('/:workspaceId/reorder', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { tasks } = req.body;
    console.log('Reordering tasks for workspace:', workspaceId);
    console.log('Request body:', req.body);
    console.log('Tasks to reorder:', JSON.stringify(tasks, null, 2));
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }
    
    if (tasks.length === 0) {
      return res.json({ tasks: [] });
    }
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedTasks = await Task.updatePositions(tasks);
    req.app.get('io').to(`workspace_${workspaceId}`).emit('tasks_reordered', updatedTasks);
    
    res.json({ tasks: updatedTasks });
  } catch (error) {
    console.error('Task reorder error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    res.status(400).json({ error: error.message });
  }
});

// Update list positions (for drag and drop)
router.put('/:workspaceId/lists/reorder', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { lists } = req.body;
    
    const isMember = await Workspace.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedLists = await TaskList.updatePositions(lists);
    req.app.get('io').to(`workspace_${workspaceId}`).emit('lists_reordered', updatedLists);
    
    res.json({ lists: updatedLists });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;