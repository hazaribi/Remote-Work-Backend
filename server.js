require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const Message = require('./models/Message');
const Workspace = require('./models/Workspace');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, /\.vercel\.app$/]
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Make io available to routes
app.set('io', io);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Remote Work Collaboration Suite API',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      workspace: '/api/workspace',
      chat: '/api/chat',
      tasks: '/api/tasks',
      documents: '/api/documents'
    }
  });
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspace', require('./routes/workspace'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/presence', require('./routes/presence'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/invite', require('./routes/invite'));

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Handle client connections
io.on('connection', (socket) => {
  console.log(`✅ User ${socket.userId} connected`);
  
  // Update presence to online
  socket.emit('presence_update', { userId: socket.userId, status: 'online' });

  // Join workspace room
  socket.on('join_workspace', async (workspaceId) => {
    try {
      const isMember = await Workspace.isMember(workspaceId, socket.userId);
      if (isMember) {
        socket.join(`workspace_${workspaceId}`);
        console.log(`User ${socket.userId} joined workspace ${workspaceId}`);
      }
    } catch (error) {
      console.error('Error joining workspace:', error);
    }
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { workspaceId, content, messageType = 'text' } = data;
      
      const isMember = await Workspace.isMember(workspaceId, socket.userId);
      if (!isMember) return;

      const message = await Message.create(content, workspaceId, socket.userId, messageType);
      io.to(`workspace_${workspaceId}`).emit('new_message', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Store active peers per workspace
  if (!socket.activePeers) {
    socket.activePeers = new Map();
  }

  // Video call signaling with duplicate prevention
  socket.on('user_calling', (data) => {
    const { workspaceId, peerId } = data;
    
    // Prevent duplicate calling events
    const callKey = `${workspaceId}_${socket.userId}`;
    if (socket.lastCallTime && Date.now() - socket.lastCallTime < 2000) {
      console.log('Ignoring duplicate call event');
      return;
    }
    socket.lastCallTime = Date.now();
    
    socket.to(`workspace_${workspaceId}`).emit('user_calling', {
      userId: socket.userId,
      peerId,
      workspaceId
    });
  });

  // Multi-user video call events with state tracking
  socket.on('peer_joined', (data) => {
    const { workspaceId, peerId } = data;
    
    // Track active peer
    socket.activePeers.set(workspaceId, peerId);
    
    socket.to(`workspace_${workspaceId}`).emit('peer_joined', {
      userId: socket.userId,
      peerId,
      workspaceId
    });
  });

  socket.on('peer_left', (data) => {
    const { workspaceId, peerId } = data;
    
    // Remove from active peers
    socket.activePeers.delete(workspaceId);
    
    socket.to(`workspace_${workspaceId}`).emit('peer_left', {
      userId: socket.userId,
      peerId,
      workspaceId
    });
  });

  socket.on('answer_call', (data) => {
    const { callerId, peerId, workspaceId } = data;
    socket.to(`workspace_${workspaceId}`).emit('call_answered', {
      answerId: socket.userId,
      peerId,
      workspaceId
    });
  });

  socket.on('reject_call', (data) => {
    const { callerId, workspaceId } = data;
    socket.to(`workspace_${workspaceId}`).emit('call_rejected', {
      rejectedBy: socket.userId,
      workspaceId
    });
  });

  socket.on('end_call', (data) => {
    const { workspaceId } = data;
    socket.to(`workspace_${workspaceId}`).emit('call_ended', {
      endedBy: socket.userId,
      workspaceId
    });
  });

  socket.on('call_ended', (data) => {
    socket.to(`workspace_${workspaceId}`).emit('call_ended', data);
  });

  // ICE candidate exchange for WebRTC
  socket.on('ice_candidate', (data) => {
    const { workspaceId, candidate, targetPeerId } = data;
    socket.to(`workspace_${workspaceId}`).emit('ice_candidate', {
      candidate,
      fromPeerId: socket.peerId,
      targetPeerId
    });
  });

  // Whiteboard events
  socket.on('whiteboard_draw', (data) => {
    const { workspaceId, line } = data;
    socket.to(`workspace_${workspaceId}`).emit('whiteboard_draw', { line });
  });

  socket.on('whiteboard_clear', (data) => {
    const { workspaceId } = data;
    socket.to(`workspace_${workspaceId}`).emit('whiteboard_clear');
  });

  socket.on('whiteboard_undo', (data) => {
    const { workspaceId, lines } = data;
    socket.to(`workspace_${workspaceId}`).emit('whiteboard_undo', { lines });
  });

  socket.on('leave_workspace', (workspaceId) => {
    socket.leave(`workspace_${workspaceId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User ${socket.userId} disconnected`);
    
    // Clean up active peers and notify workspaces
    if (socket.activePeers) {
      socket.activePeers.forEach((peerId, workspaceId) => {
        socket.to(`workspace_${workspaceId}`).emit('peer_left', {
          userId: socket.userId,
          peerId,
          workspaceId
        });
      });
      socket.activePeers.clear();
    }
    
    // Update presence to offline
    socket.broadcast.emit('presence_update', { userId: socket.userId, status: 'offline' });
  });
});

// Note: Start YJS and PeerJS servers separately:
// node yjs-server.js
// node peer-server.js

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Express API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`📝 Y.js WebSocket server running on port 1234`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Server shutting down...');
  if (clientSocket) {
    clientSocket.disconnect();
  }
  server.close();
  process.exit(0);
});