require('dotenv').config();
const { PeerServer } = require('peer');

// PeerJS server on port 9001
const peerServer = PeerServer({
  port: 9001,
  path: '/peerjs',
  allow_discovery: true
});

console.log('🎥 PeerJS server running on port 9001');
console.log('📡 Path: /peerjs');

module.exports = peerServer;