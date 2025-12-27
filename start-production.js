const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting ChatWave Application for kingcloud.live...');

// Detect if running in Docker (standalone files are in /app directly)
const isDocker = fs.existsSync('/app/server.js') || fs.existsSync('/app/socket-server.js');
const baseDir = isDocker ? '/app' : __dirname;

// Determine the socket server file name
const socketServerFile = fs.existsSync(path.join(baseDir, 'socket-server.js')) 
  ? 'socket-server.js' 
  : 'server.js';

console.log(`Running in ${isDocker ? 'Docker' : 'local'} mode`);
console.log(`Base directory: ${baseDir}`);
console.log(`Socket server file: ${socketServerFile}`);

// Start Socket.IO server
console.log('Starting Socket.IO server on port', process.env.SOCKET_PORT || '3001');
const socketServer = spawn('node', [path.join(baseDir, socketServerFile)], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    SOCKET_PORT: process.env.SOCKET_PORT || '3001',
    PORT: process.env.SOCKET_PORT || '3001'
  }
});

// Wait a bit for Socket.IO to start, then start Next.js
setTimeout(() => {
  console.log('Starting Next.js server on port', process.env.NEXT_PORT || process.env.PORT || '3000');
  
  // For Docker standalone build, server.js is in /app directly
  // For local standalone build, it's in .next/standalone/server.js
  let standalonePath;
  if (isDocker) {
    standalonePath = path.join(baseDir, 'server.js');
  } else {
    standalonePath = path.join(baseDir, '.next', 'standalone', 'server.js');
  }
  
  console.log(`Next.js standalone path: ${standalonePath}`);
  
  const nextServer = spawn('node', [standalonePath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.NEXT_PORT || process.env.PORT || '3000',
      HOSTNAME: '0.0.0.0'
    },
    cwd: isDocker ? baseDir : path.join(baseDir, '.next', 'standalone')
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
