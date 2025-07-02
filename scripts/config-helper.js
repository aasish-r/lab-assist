#!/usr/bin/env node
/**
 * Lab Assist Configuration Helper
 * Quick tool to check and configure AI backends
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import configuration from the centralized config
const { BACKEND_CONFIG, CONFIG_PRESETS, DEFAULT_CONFIG } = require('../dist/shared/app-config.js');

const AI_MODEL_INFO = BACKEND_CONFIG;

const PRESETS = {
  minimal: { backend: 'classification', description: 'Instant startup, 0 downloads' },
  tiny: { backend: 'ollama-tiny', description: 'Lightweight AI, 637MB download' },
  balanced: { backend: 'ollama-light', description: 'Good accuracy, 2.3GB download' },
  performance: { backend: 'llamacpp', description: 'Maximum speed, manual setup' }
};

function showUsage() {
  console.log('🧪 Lab Assist Configuration Helper');
  console.log('');
  console.log('Usage:');
  console.log('  npm run config                    # Show current configuration');
  console.log('  npm run config list               # List all available options');
  console.log('  npm run config set <preset>       # Set configuration preset');
  console.log('  npm run config backend <backend>  # Set specific backend');
  console.log('');
}

function showCurrentConfig() {
  const currentBackend = process.env.LAB_ASSIST_AI_BACKEND || DEFAULT_CONFIG.ai.preferredBackend;
  const currentPreset = process.env.LAB_ASSIST_PRESET || 'tiny';
  
  console.log('🎯 Current Configuration:');
  console.log(`   Preset: ${currentPreset}`);
  console.log(`   Backend: ${currentBackend}`);
  console.log(`   Size: ${AI_MODEL_INFO[currentBackend]?.size || 'unknown'}`);
  console.log(`   Description: ${AI_MODEL_INFO[currentBackend]?.description || 'unknown'}`);
  console.log('');
  
  if (AI_MODEL_INFO[currentBackend]?.downloadNeeded) {
    console.log(`💡 To setup this backend, run: ${AI_MODEL_INFO[currentBackend].setupCommand}`);
  }
}

function listOptions() {
  console.log('📋 Available Presets:');
  Object.entries(PRESETS).forEach(([preset, config]) => {
    const info = AI_MODEL_INFO[config.backend];
    console.log(`   ${preset.padEnd(12)} - ${config.description} (${info.size})`);
  });
  console.log('');
  
  console.log('🔧 Available Backends:');
  Object.entries(AI_MODEL_INFO).forEach(([backend, info]) => {
    const needsSetup = info.downloadNeeded ? ' [needs setup]' : ' [ready]';
    console.log(`   ${backend.padEnd(15)} - ${info.description} (${info.size})${needsSetup}`);
  });
  console.log('');
  
  console.log('⚡ Quick Start Commands:');
  console.log('   LAB_ASSIST_PRESET=tiny npm start          # Use tiny model');
  console.log('   LAB_ASSIST_AI_BACKEND=classification npm start  # Force classification');
}

function setPreset(preset) {
  if (!PRESETS[preset]) {
    console.log(`❌ Unknown preset: ${preset}`);
    console.log(`Available presets: ${Object.keys(PRESETS).join(', ')}`);
    return;
  }
  
  const config = PRESETS[preset];
  const info = AI_MODEL_INFO[config.backend];
  
  console.log(`🎯 Setting preset: ${preset}`);
  console.log(`   Backend: ${config.backend}`);
  console.log(`   Size: ${info.size}`);
  console.log(`   Description: ${config.description}`);
  console.log('');
  
  if (info.downloadNeeded) {
    console.log(`⚠️  This backend requires setup. Run: ${info.setupCommand}`);
    console.log('');
  }
  
  console.log('🚀 To use this preset:');
  console.log(`   LAB_ASSIST_PRESET=${preset} npm start`);
  console.log('');
  console.log('Or add to your shell profile:');
  console.log(`   export LAB_ASSIST_PRESET=${preset}`);
}

function setBackend(backend) {
  if (!AI_MODEL_INFO[backend]) {
    console.log(`❌ Unknown backend: ${backend}`);
    console.log(`Available backends: ${Object.keys(AI_MODEL_INFO).join(', ')}`);
    return;
  }
  
  const info = AI_MODEL_INFO[backend];
  
  console.log(`🎯 Setting backend: ${backend}`);
  console.log(`   Size: ${info.size}`);
  console.log(`   Description: ${info.description}`);
  console.log('');
  
  if (info.downloadNeeded) {
    console.log(`⚠️  This backend requires setup. Run: ${info.setupCommand}`);
    console.log('');
  }
  
  console.log('🚀 To use this backend:');
  console.log(`   LAB_ASSIST_AI_BACKEND=${backend} npm start`);
  console.log('');
  console.log('Or add to your shell profile:');
  console.log(`   export LAB_ASSIST_AI_BACKEND=${backend}`);
}

// Main execution
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'list':
    listOptions();
    break;
  case 'set':
    if (!arg) {
      console.log('❌ Please specify a preset name');
      console.log(`Available: ${Object.keys(PRESETS).join(', ')}`);
    } else {
      setPreset(arg);
    }
    break;
  case 'backend':
    if (!arg) {
      console.log('❌ Please specify a backend name');
      console.log(`Available: ${Object.keys(AI_MODEL_INFO).join(', ')}`);
    } else {
      setBackend(arg);
    }
    break;
  case undefined:
    showCurrentConfig();
    break;
  default:
    showUsage();
}