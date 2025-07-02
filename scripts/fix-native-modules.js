#!/usr/bin/env node
/**
 * Lab Assist Native Module Fix Script
 * Diagnoses and fixes native module issues for Electron
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Lab Assist Native Module Diagnostic & Fix');
console.log('===========================================');

// Check Node and Electron versions
function checkVersions() {
  console.log('\n📋 Version Check:');
  try {
    const nodeVersion = process.version;
    console.log(`   Node.js: ${nodeVersion}`);
    
    const electronVersion = execSync('npx electron --version', { encoding: 'utf8' }).trim();
    console.log(`   Electron: ${electronVersion}`);
    
    // Check if better-sqlite3 binary exists
    const sqlitePaths = [
      'node_modules/better-sqlite3/build/Release/better_sqlite3.node',
      'node_modules/better-sqlite3/build/better_sqlite3.node'
    ];
    
    let sqliteFound = false;
    for (const sqlitePath of sqlitePaths) {
      if (fs.existsSync(sqlitePath)) {
        console.log(`   ✅ SQLite binary found: ${sqlitePath}`);
        sqliteFound = true;
        break;
      }
    }
    
    if (!sqliteFound) {
      console.log('   ❌ SQLite binary not found - needs rebuild');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error checking versions: ${error.message}`);
    return false;
  }
}

// Test if better-sqlite3 can load
function testSQLite() {
  console.log('\n🧪 Testing SQLite Module:');
  try {
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    db.close();
    console.log('   ✅ better-sqlite3 loads successfully');
    return true;
  } catch (error) {
    console.log(`   ❌ better-sqlite3 failed to load: ${error.message}`);
    return false;
  }
}

// Rebuild native modules
function rebuildModules() {
  console.log('\n🔨 Rebuilding Native Modules:');
  
  const methods = [
    {
      name: 'electron-rebuild',
      command: 'npx electron-rebuild --verbose'
    },
    {
      name: 'manual better-sqlite3',
      command: 'cd node_modules/better-sqlite3 && npm run build-release'
    },
    {
      name: 'npm rebuild',
      command: 'npm rebuild better-sqlite3'
    }
  ];
  
  for (const method of methods) {
    console.log(`\n   Trying: ${method.name}...`);
    try {
      execSync(method.command, { 
        stdio: 'pipe',
        timeout: 300000 // 5 minutes
      });
      console.log(`   ✅ ${method.name} completed successfully`);
      
      // Test if it worked
      if (testSQLite()) {
        console.log('\n🎉 Native modules rebuilt successfully!');
        return true;
      }
    } catch (error) {
      console.log(`   ❌ ${method.name} failed: ${error.message}`);
    }
  }
  
  return false;
}

// Provide solutions
function provideSolutions() {
  console.log('\n💡 Solutions:');
  console.log('');
  console.log('1. **Quick Fix - Disable Database**:');
  console.log('   LAB_ASSIST_DATABASE_ENABLED=false npm start');
  console.log('');
  console.log('2. **Rebuild Native Modules**:');
  console.log('   npm run rebuild-native');
  console.log('');
  console.log('3. **Manual Build**:');
  console.log('   cd node_modules/better-sqlite3');
  console.log('   npm run build-release');
  console.log('');
  console.log('4. **Re-install better-sqlite3**:');
  console.log('   npm uninstall better-sqlite3');
  console.log('   npm install better-sqlite3');
  console.log('');
  console.log('5. **Use Docker (if available)**:');
  console.log('   docker build -t lab-assist .');
  console.log('   docker run -it lab-assist');
  console.log('');
  console.log('ℹ️  The app works without database - you\'ll just lose data persistence.');
}

// Main execution
async function main() {
  const versionsOk = checkVersions();
  const sqliteWorks = testSQLite();
  
  if (sqliteWorks) {
    console.log('\n✅ All native modules working correctly!');
    console.log('   You can enable database with: LAB_ASSIST_DATABASE_ENABLED=true npm start');
    return;
  }
  
  console.log('\n⚠️  Native modules need attention');
  
  // Ask user if they want to try rebuilding
  const args = process.argv.slice(2);
  if (args.includes('--auto-fix') || args.includes('-f')) {
    console.log('\n🔄 Auto-fixing...');
    const success = rebuildModules();
    if (!success) {
      provideSolutions();
    }
  } else {
    console.log('\nRun with --auto-fix to attempt automatic rebuild');
    provideSolutions();
  }
}

// Handle command line arguments
if (require.main === module) {
  main().catch(console.error);
}