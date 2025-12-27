const { spawn } = require('child_process');
const path = require('path');

console.log('Starting ChatWave Application for kingcloud.live...');

// Start Socket.IO server (server.js is the Socket.IO server)
console.log('Starting Socket.IO server on port', process.env.SOCKET_PORT || '3001');
const socketServer = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    SOCKET_PORT: process.env.SOCKET_PORT || '3001',
    PORT: process.env.SOCKET_PORT || '3001'
  }
});

// Wait a bit for Socket.IO to start, then start Next.js
setTimeout(() => {
  console.log('Starting Next.js server on port', process.env.NEXT_PORT || '3000');
  
  // For standalone build, the server is in .next/standalone/server.js
  const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');
  
  const nextServer = spawn('node', [standalonePath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.NEXT_PORT || '3000',
      HOSTNAME: '0.0.0.0'
    },
    cwd: path.join(__dirname, '.next', 'standalone')
  });

  nextServer.on('error', (err) => {
    console.error('Next.js server error:', err);
  });

  nextServer.on('exit', (code) => {
    console.log(`Next.js server exited with code ${code}`);
    socketServer.kill();
    process.exit(code || 0);
  });
}, 2000);

socketServer.on('error', (err) => {
  console.error('Socket.IO server error:', err);
});

socketServer.on('exit', (code) => {
  console.log(`Socket.IO server exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  socketServer.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  socketServer.kill('SIGINT');
  process.exit(0);
});
