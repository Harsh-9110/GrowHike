#!/usr/bin/env node

/**
 * Neon Database Setup Script for GROW HIKE
 * 
 * This script helps you set up and manage your Neon database:
 * - Creates necessary environment variables
 * - Pushes schema to database
 * - Initializes with sample data
 * - Provides database health checks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, COLORS.green);
}

function logError(message) {
  log(`✗ ${message}`, COLORS.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, COLORS.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, COLORS.blue);
}

async function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    logWarning('.env file not found');
    
    const examplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      logSuccess('Created .env file from .env.example');
      logWarning('Please update DATABASE_URL and other variables in .env file');
      return false;
    } else {
      logError('No .env.example file found. Please create .env manually');
      return false;
    }
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('DATABASE_URL=')) {
    logError('DATABASE_URL not found in .env file');
    return false;
  }
  
  logSuccess('.env file configured');
  return true;
}

async function testDatabaseConnection() {
  try {
    const { stdout } = await execAsync('npm run check');
    logSuccess('TypeScript compilation passed');
    
    // Test database connection by importing our utilities
    const { checkDatabaseHealth } = await import('../server/db.ts');
    const health = await checkDatabaseHealth();
    
    if (health.healthy) {
      logSuccess('Database connection successful');
      return true;
    } else {
      logError(`Database connection failed: ${health.error}`);
      return false;
    }
  } catch (error) {
    logError(`Connection test failed: ${error.message}`);
    return false;
  }
}

async function pushSchema() {
  try {
    logInfo('Pushing database schema...');
    const { stdout } = await execAsync('npm run db:push');
    logSuccess('Database schema updated');
    console.log(stdout);
    return true;
  } catch (error) {
    logError(`Schema push failed: ${error.message}`);
    
    // Try force push if regular push fails
    try {
      logWarning('Trying force push...');
      const { stdout } = await execAsync('npm run db:push -- --force');
      logSuccess('Database schema force updated');
      console.log(stdout);
      return true;
    } catch (forceError) {
      logError(`Force push also failed: ${forceError.message}`);
      return false;
    }
  }
}

async function initializeData() {
  try {
    logInfo('Initializing database with sample data...');
    const { initializeDatabase } = await import('../server/neon-utils.ts');
    const result = await initializeDatabase();
    
    if (result) {
      logSuccess('Database initialized with sample data');
      return true;
    } else {
      logWarning('Database initialization skipped (data already exists)');
      return true;
    }
  } catch (error) {
    logError(`Data initialization failed: ${error.message}`);
    return false;
  }
}

async function showDatabaseInfo() {
  try {
    const { getNeonDatabaseInfo } = await import('../server/neon-utils.ts');
    const info = await getNeonDatabaseInfo();
    
    log(`\\n${COLORS.bold}📊 Database Information:${COLORS.reset}`);
    log(`Host: ${info.connectionInfo.host}`);
    log(`Database: ${info.connectionInfo.database}`);
    log(`SSL: ${info.connectionInfo.ssl}`);
    
    log(`\\n${COLORS.bold}📈 Statistics:${COLORS.reset}`);
    log(`Tables: ${info.stats.tableCount}`);
    log(`Users: ${info.stats.userCount}`);
    log(`Stocks: ${info.stats.stockCount}`);
    log(`IPOs: ${info.stats.ipoCount}`);
    log(`Orders: ${info.stats.orderCount}`);
    
    if (info.health.healthy) {
      logSuccess('Database is healthy');
    } else {
      logError(`Database health check failed: ${info.health.error}`);
    }
    
  } catch (error) {
    logError(`Failed to get database info: ${error.message}`);
  }
}

async function main() {
  log(`${COLORS.bold}🚀 GROW HIKE - Neon Database Setup${COLORS.reset}\\n`);
  
  const steps = [
    { name: 'Check environment configuration', fn: checkEnvFile },
    { name: 'Test database connection', fn: testDatabaseConnection },
    { name: 'Push database schema', fn: pushSchema },
    { name: 'Initialize sample data', fn: initializeData },
  ];
  
  for (const step of steps) {
    logInfo(`${step.name}...`);
    const success = await step.fn();
    
    if (!success) {
      logError(`Setup failed at: ${step.name}`);
      process.exit(1);
    }
  }
  
  logSuccess('\\nDatabase setup completed successfully!');
  
  // Show database information
  await showDatabaseInfo();
  
  log(`\\n${COLORS.bold}🎉 Your GROW HIKE database is ready!${COLORS.reset}`);
  log(`\\nNext steps:`);
  log(`1. Start the development server: ${COLORS.blue}npm run dev${COLORS.reset}`);
  log(`2. Visit http://localhost:5000 to see your app`);
  log(`3. Check database status at: ${COLORS.blue}http://localhost:5000/api/database/info${COLORS.reset}`);
}

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'info':
    showDatabaseInfo();
    break;
  case 'push':
    pushSchema();
    break;
  case 'init':
    initializeData();
    break;
  default:
    main();
}