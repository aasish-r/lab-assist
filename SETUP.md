# Lab Assist - Setup Guide

Complete setup instructions for developers and users.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 1GB free space (includes Whisper model)
- **Audio**: Microphone or headset with clear audio input

### Development Requirements
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For version control
- **C++ Build Tools**: Required for native dependencies (see platform-specific instructions)

## Installation Guide

### Option 1: Pre-built Application (Recommended for Users)

1. **Download the latest release**
   - Go to the [Releases page](link-to-releases)
   - Download the appropriate file for your operating system:
     - Windows: `lab-assist-setup-1.0.0.exe`
     - macOS: `lab-assist-1.0.0.dmg`
     - Linux: `lab-assist-1.0.0.AppImage`

2. **Install the application**
   - **Windows**: Run the installer and follow the setup wizard
   - **macOS**: Open the DMG and drag the app to Applications folder
   - **Linux**: Make the AppImage executable and run it

3. **First Launch**
   - The app will request microphone permissions
   - Allow microphone access for voice recognition to work
   - The database will be automatically created in your user data folder

### Option 2: Development Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/lab-assist.git
cd lab-assist
```

#### Step 2: Install Node.js Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

#### Step 3: Platform-Specific Setup

##### Windows
```bash
# Install Windows build tools (run as Administrator)
npm install --global windows-build-tools

# Alternative: Install Visual Studio Build Tools 2019
# Download from: https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools
```

##### macOS
```bash
# Install Xcode command line tools
xcode-select --install

# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

##### Linux (Ubuntu/Debian)
```bash
# Install build essentials
sudo apt update
sudo apt install build-essential libnss3-dev libatk-bridge2.0-dev libdrm2 libgtk-3-dev libgbm-dev

# For other distributions, install equivalent packages
```

#### Step 4: Download Whisper Model
```bash
# Create models directory
mkdir -p models

# Download Whisper base English model (~150MB)
# For development/testing, the app works with a mock model
# For production, download the real model:
curl -L "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin" -o models/ggml-base.en.bin

# Verify download
ls -la models/
```

#### Step 5: Build and Run
```bash
# Build TypeScript files
npm run build

# Start the application
npm start

# Or run in development mode with hot reload
npm run dev
```

## Configuration

### Audio Settings

The application automatically detects available audio devices. You can:

1. **Select Audio Device**
   - Open the app settings panel
   - Choose your preferred microphone from the dropdown
   - Test audio levels with the visual indicator

2. **Audio Quality Settings** (Advanced)
   ```typescript
   // In src/main/audio/AudioManager.ts
   private readonly SAMPLE_RATE = 16000; // Whisper prefers 16kHz
   private readonly SILENCE_THRESHOLD = 0.01; // Adjust for environment
   private readonly SILENCE_DURATION = 1500; // 1.5 seconds
   ```

### Database Configuration

The SQLite database is automatically created at:
- **Windows**: `%APPDATA%/lab-assist/lab-assist.db`
- **macOS**: `~/Library/Application Support/lab-assist/lab-assist.db`
- **Linux**: `~/.config/lab-assist/lab-assist.db`

To change the database location:
```typescript
// In src/main/database/DatabaseManager.ts
constructor() {
  const userDataPath = app.getPath('userData');
  this.dbPath = path.join(userDataPath, 'your-custom-name.db');
}
```

### Whisper Model Configuration

Available models (trade-off between accuracy and performance):
- `ggml-tiny.en.bin` - 39MB, fastest, lower accuracy
- `ggml-base.en.bin` - 142MB, balanced (recommended)
- `ggml-small.en.bin` - 466MB, better accuracy, slower
- `ggml-medium.en.bin` - 1.5GB, high accuracy, requires 8GB+ RAM

Change model in `src/main/speech/SpeechService.ts`:
```typescript
constructor() {
  this.modelPath = path.join(__dirname, '../../../models/ggml-small.en.bin');
}
```

## Development Workflow

### Project Structure Overview
```
lab-assist/
├── src/
│   ├── main/           # Electron main process (Node.js)
│   ├── renderer/       # React frontend
│   ├── preload/        # IPC bridge
│   └── shared/         # Shared types
├── models/             # AI models
├── dist/               # Compiled output
└── docs/               # Documentation
```

### Development Commands
```bash
# TypeScript compilation
npm run build              # One-time build
npm run build:watch       # Watch mode

# Application execution
npm start                 # Production mode
npm run dev              # Development with hot reload

# Development tools
npm run electron:dev     # Electron in dev mode
npx tsc --noEmit        # Type checking only
```

### Hot Reload Setup

The development environment supports hot reload for both processes:

1. **Main Process**: Watches TypeScript files and restarts Electron
2. **Renderer Process**: React hot reload for instant UI updates
3. **Preload Scripts**: Recompiled automatically on changes

### Debugging

#### Enable Debug Logs
```bash
# Set environment variable
export DEBUG=lab-assist:*
npm run dev

# Or on Windows
set DEBUG=lab-assist:*
npm run dev
```

#### Browser DevTools
- Press `Ctrl+Shift+I` (or `Cmd+Option+I` on macOS) to open DevTools
- Console shows renderer process logs
- Terminal shows main process logs

#### VSCode Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Electron Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "program": "${workspaceFolder}/node_modules/.bin/electron",
      "args": [".", "--remote-debugging-port=9222"],
      "outputCapture": "std"
    }
  ]
}
```

## Testing Setup

### Unit Testing
```bash
# Install testing dependencies
npm install --save-dev jest @types/jest ts-jest

# Run tests
npm test

# Watch mode
npm run test:watch
```

### Audio Testing
```bash
# Test microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Microphone access granted'))
  .catch(err => console.error('Microphone access denied:', err));
```

### Database Testing
```bash
# Test database operations
npm run test:db

# Or manually test in development
# Open DevTools Console and run:
window.electronAPI.database.getAnimals()
```

## Production Build

### Building Executable
```bash
# Install electron-builder
npm install --save-dev electron-builder

# Build for current platform
npm run build:electron

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### Build Configuration
```json
// package.json
{
  "build": {
    "appId": "com.yourcompany.lab-assist",
    "productName": "Lab Assist",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "models/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png"
    }
  }
}
```

### Code Signing (Production)
```bash
# Windows (requires certificate)
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate_password"

# macOS (requires Apple Developer account)
export CSC_LINK="Developer ID Application: Your Name"
export CSC_KEY_PASSWORD="keychain_password"

npm run build:electron
```

## Environment Variables

Create a `.env` file in the project root:
```bash
# Development settings
NODE_ENV=development
DEBUG=lab-assist:*

# Production settings
NODE_ENV=production
WHISPER_MODEL_PATH=./models/ggml-base.en.bin

# Optional: Custom paths
DATABASE_PATH=./data/lab-assist.db
TEMP_AUDIO_PATH=./temp/audio
```

## Troubleshooting

### Common Issues

#### Native Module Compilation Errors
```bash
# Clear node modules and rebuild
rm -rf node_modules
npm install

# Rebuild native modules
npm run electron:rebuild
```

#### Audio Permission Issues
- **Windows**: Check Windows Privacy Settings > Microphone
- **macOS**: System Preferences > Security & Privacy > Microphone
- **Linux**: Check `alsamixer` or `pulseaudio` settings

#### Whisper Model Loading Errors
```bash
# Verify model file
file models/ggml-base.en.bin
# Should show: data

# Check file size (should be ~142MB for base model)
ls -lh models/ggml-base.en.bin

# Re-download if corrupted
rm models/ggml-base.en.bin
curl -L "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin" -o models/ggml-base.en.bin
```

#### Database Access Issues
```bash
# Check permissions
ls -la ~/.config/lab-assist/

# Reset database (WARNING: Deletes all data)
rm ~/.config/lab-assist/lab-assist.db
```

### Performance Optimization

#### Memory Usage
- **Minimum**: 4GB system RAM
- **Recommended**: 8GB+ for best performance
- **Whisper model**: ~1GB RAM usage
- **Total app usage**: ~1.5GB typical

#### CPU Usage
- **Speech processing**: High CPU during transcription
- **Idle state**: Minimal CPU usage
- **Optimization**: Lower Whisper model size if needed

### Getting Help

1. **Check logs**: Open DevTools Console for error messages
2. **GitHub Issues**: Report bugs with system info and logs
3. **Documentation**: Check `/docs` for detailed guides
4. **Community**: Join discussions for usage questions

## Next Steps

After setup:
1. **Test audio**: Verify microphone is working
2. **Try commands**: Start with "rat 1 cage 1 weight 250 grams"
3. **Check data**: Switch to Data view to see recordings
4. **Customize**: Adjust audio settings for your environment
5. **Integrate**: Fit into your lab workflow

For additional help, see the main [README.md](README.md) or contact support.