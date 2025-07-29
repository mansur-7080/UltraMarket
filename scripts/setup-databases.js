#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up UltraMarket Databases...');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
}

// Setup Prisma
try {
  console.log('📦 Setting up Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma setup completed');
} catch (error) {
  console.log('⚠️  Prisma setup failed, continuing...');
}

// Setup MongoDB indexes (if available)
try {
  console.log('🍃 Setting up MongoDB indexes...');
  execSync('mongo ultramarket --eval "db.createCollection(\'products\'); db.products.createIndex({name: 1}); db.products.createIndex({category: 1});"', { stdio: 'inherit' });
  console.log('✅ MongoDB indexes created');
} catch (error) {
  console.log('⚠️  MongoDB setup failed, continuing...');
}

// Setup Redis (if available)
try {
  console.log('📊 Testing Redis connection...');
  execSync('redis-cli ping', { stdio: 'inherit' });
  console.log('✅ Redis connection successful');
} catch (error) {
  console.log('⚠️  Redis not available, continuing...');
}

console.log('🎉 Database setup completed!');
console.log('📋 Next steps:');
console.log('   1. Run: npm run migrate');
console.log('   2. Run: npm start'); 