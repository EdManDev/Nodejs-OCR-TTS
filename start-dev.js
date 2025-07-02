#!/usr/bin/env node

/**
 * Development start script
 * This bypasses npm script restrictions and starts the development server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Node.js OCR TTS Development Server...\n');

// Check if ts-node-dev is available
const tsNodeDevPath = path.join(__dirname, 'node_modules', '.bin', 'ts-node-dev');

const args = [
  '--respawn',
  '--transpile-only',
  '--ignore-watch', 'node_modules',
  '--ignore-watch', 'dist',
  '--ignore-watch', 'logs',
  '--ignore-watch', 'uploads',
  '--ignore-watch', 'temp',
  'src/index.ts'
];

// Start the development server
const child = spawn('node', [tsNodeDevPath, ...args], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start development server:', error.message);
  console.log('\n💡 Try running: node start-dev.js');
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.log(`\n❌ Development server exited with code ${code}`);
  } else {
    console.log('\n✅ Development server stopped gracefully');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development server...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping development server...');
  child.kill('SIGTERM');
});
