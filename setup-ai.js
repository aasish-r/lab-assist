/**
 * Setup script for downloading and configuring AI models
 * Run this once to download the Llama 3.2 3B model for enhanced command understanding
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🤖 Lab Assist AI Setup\n');

// Check if Ollama is installed
function checkOllama() {
  return new Promise((resolve) => {
    exec('ollama --version', (error, stdout) => {
      if (error) {
        console.log('❌ Ollama not found. Please install Ollama first:');
        console.log('   Visit: https://ollama.ai/download');
        console.log('   Or run: curl -fsSL https://ollama.ai/install.sh | sh\n');
        resolve(false);
      } else {
        console.log('✅ Ollama found:', stdout.trim());
        resolve(true);
      }
    });
  });
}

// Download the AI model
function downloadModel() {
  return new Promise((resolve) => {
    console.log('📦 Downloading Llama 3.2 3B model (~2GB)...');
    console.log('   This may take a few minutes...\n');
    
    const child = exec('ollama pull llama3.2:3b');
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Model downloaded successfully!');
        resolve(true);
      } else {
        console.log('\n❌ Failed to download model');
        resolve(false);
      }
    });
  });
}

// Test the model
function testModel() {
  return new Promise((resolve) => {
    console.log('\n🧪 Testing AI model...');
    
    const testPrompt = 'Parse this command: "rat 5 cage 3 weight 280 grams". Return JSON with intent and entities.';
    
    exec(`ollama run llama3.2:3b "${testPrompt}"`, { timeout: 30000 }, (error, stdout) => {
      if (error) {
        console.log('❌ Model test failed:', error.message);
        resolve(false);
      } else {
        console.log('✅ Model test successful!');
        console.log('Sample response:', stdout.substring(0, 200) + '...\n');
        resolve(true);
      }
    });
  });
}

// Create configuration file
function createConfig() {
  const config = {
    nlu: {
      enabled: true,
      model: 'llama3.2:3b',
      fallbackToRegex: true,
      confidence: {
        aiThreshold: 0.7,
        regexThreshold: 0.8
      }
    },
    setupDate: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(__dirname, 'ai-config.json'),
    JSON.stringify(config, null, 2)
  );

  console.log('✅ Configuration saved to ai-config.json');
}

// Main setup function
async function setup() {
  try {
    const hasOllama = await checkOllama();
    if (!hasOllama) {
      return;
    }

    const modelDownloaded = await downloadModel();
    if (!modelDownloaded) {
      return;
    }

    const modelWorks = await testModel();
    if (!modelWorks) {
      console.log('⚠️  Model downloaded but test failed. You can still use the app with fallback to regex parsing.');
    }

    createConfig();

    console.log('\n🎉 AI Setup Complete!');
    console.log('\nFeatures enabled:');
    console.log('• Natural language command understanding');
    console.log('• Support for varied phrasings and word numbers');
    console.log('• Automatic fallback to regex patterns if AI fails');
    console.log('• Enhanced context awareness\n');
    
    console.log('Try these enhanced commands:');
    console.log('• "weigh rat number five in cage three at two hundred eighty grams"');
    console.log('• "update the weight to three hundred"');
    console.log('• "move animal seven into cage twelve"');
    console.log('• "show me rats around two fifty"');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run setup
setup();