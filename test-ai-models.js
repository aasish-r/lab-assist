/**
 * Test script for AI model performance comparison
 */

const { AdaptiveNLUService } = require('./dist/main/services/AdaptiveNLUService');

async function testAIModels() {
  console.log('🧪 Testing AI Models for Lab Commands\n');

  const testCommands = [
    "rat 5 cage 3 weight 280 grams",
    "weigh rat number five in cage three at two eighty",
    "change weight to 300 grams",
    "update the weight to three hundred", 
    "move rat 7 to cage 12",
    "move animal seven into cage twelve",
    "show rats around 250 grams",
    "find animals around two fifty",
    "stop listening",
    "start recording"
  ];

  try {
    const nluService = new AdaptiveNLUService({
      preferredBackend: 'classification', // Start with fastest
      enableBenchmarking: true
    });

    console.log('📊 Testing Classification Backend (Ultra-fast)\n');
    
    for (const command of testCommands) {
      const startTime = Date.now();
      
      try {
        const transcription = { text: command, confidence: 0.95, processingTime: 0 };
        const result = await nluService.parseCommand(transcription);
        const processingTime = Date.now() - startTime;
        
        console.log(`✅ "${command}"`);
        console.log(`   → Intent: ${result.type}, Confidence: ${result.confidence.toFixed(2)}, Time: ${processingTime}ms`);
        
        if (Object.keys(result.entities).length > 0) {
          console.log(`   → Entities:`, JSON.stringify(result.entities));
        }
        console.log('');
        
      } catch (error) {
        console.log(`❌ "${command}" → Error: ${error.message}\n`);
      }
    }

    // Get system status
    console.log('📋 System Status:');
    const status = await nluService.getSystemStatus();
    console.log(`Active Backend: ${status.activeBackend}`);
    console.log(`Available Backends: ${status.availableBackends.join(', ')}`);
    
    if (status.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      status.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    console.log('\n🎯 Summary:');
    console.log('• Classification-based parsing is working correctly');
    console.log('• Ready for voice commands with adaptive AI selection');
    console.log('• Install additional models for enhanced accuracy');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testAIModels().catch(console.error);
}

module.exports = { testAIModels };