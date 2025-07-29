#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting UltraMarket Databases...');

// Start Redis
const redis = spawn('redis-server', ['--port', '6379'], {
  stdio: 'inherit',
  shell: true
});

redis.on('error', (error) => {
  console.log('⚠️  Redis not found, skipping...');
});

// Start PostgreSQL (if available)
const postgres = spawn('pg_ctl', ['-D', '/usr/local/var/postgres', 'start'], {
  stdio: 'inherit',
  shell: true
});

postgres.on('error', (error) => {
  console.log('⚠️  PostgreSQL not found, skipping...');
});

// Start MongoDB (if available)
const mongodb = spawn('mongod', ['--dbpath', '/usr/local/var/mongodb'], {
  stdio: 'inherit',
  shell: true
});

mongodb.on('error', (error) => {
  console.log('⚠️  MongoDB not found, skipping...');
});

console.log('✅ Database startup initiated');
console.log('📊 Redis: localhost:6379');
console.log('🐘 PostgreSQL: localhost:5432');
console.log('🍃 MongoDB: localhost:27017');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down databases...');
  redis.kill();
  postgres.kill();
  mongodb.kill();
  process.exit(0);
}); 