const { spawn } = require('child_process');

console.log('Starting ChatWave Application...');

// Start Socket.IO server
console.log('Starting Socket.IO server on port', process.env.SOCKET_PORT || '3001');
const socketServer = spawn('node', ['socket-server.js'], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    PORT: process.env.SOCKET_PORT || '3001'
  }
});

// Wait a bit for Socket.IO to start, then start Next.js
setTimeout(() => {
  console.log('Starting Next.js server on port', process.env.PORT || '3000');
  // The standalone server.js is copied to root by Next.js build
  const nextServer = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT || '3000',
      HOSTNAME: '0.0.0.0'
    }
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
