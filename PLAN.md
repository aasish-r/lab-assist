# Lab Assist - Detailed Implementation Plan

## Project Overview
Voice-controlled lab data entry application for pharmacology research. Enables hands-free recording of animal weights, cage assignments, and lab operations through intelligent speech recognition.

## Core Requirements
- **Offline Operation**: No internet dependency for core functionality
- **Voice-Only Interface**: Completely hands-free operation with smart confirmations
- **Context Awareness**: Remember last mentioned animals/cages for efficient data entry
- **Intelligent Processing**: Process complete sentences, not individual words
- **Data Integrity**: SQLite with audit trail for reliable data storage

## Technical Architecture

### Technology Stack
- **Frontend**: Electron + React + TypeScript
- **Speech Recognition**: Whisper.cpp via Node.js bindings
- **Database**: SQLite3 with better-sqlite3 driver
- **Audio Processing**: Web Audio API + node-microphone
- **Build System**: Webpack + Electron Builder

### Project Structure
```
lab-assist/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.ts          # Application entry point
│   │   ├── audio/           # Audio processing services
│   │   ├── speech/          # Whisper integration
│   │   ├── database/        # SQLite operations
│   │   └── services/        # Business logic services
│   ├── renderer/            # Electron renderer process
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # Frontend services
│   │   └── types/          # TypeScript definitions
│   └── shared/             # Shared utilities and types
├── assets/                 # Static assets
├── docs/                   # Documentation
└── scripts/               # Build and setup scripts
```

## Core Components

### 1. Audio Processing Pipeline
**Location**: `src/main/audio/`

**Components**:
- `AudioManager`: Device management and stream control
- `SilenceDetector`: Intelligent sentence completion detection
- `AudioBuffer`: Rolling buffer for audio chunks

**Key Features**:
- Continuous recording with 1.5s silence threshold
- Background processing during speech
- Automatic device reconnection

### 2. Speech Recognition Service
**Location**: `src/main/speech/`

**Components**:
- `WhisperService`: Whisper.cpp integration
- `TranscriptionProcessor`: Confidence scoring and validation
- `ModelManager`: Keep Whisper model in memory

**Processing Flow**:
1. Receive audio chunk after silence detection
2. Process with Whisper.cpp for transcription + confidence
3. Return structured result with confidence score

### 3. Command Engine
**Location**: `src/main/services/`

**Components**:
- `CommandParser`: Parse natural language into structured commands
- `ContextManager`: Track session state (last rat, cage, etc.)
- `CommandExecutor`: Execute parsed commands with smart confirmations
- `ValidationService`: Validate command parameters

**Command Types**:
```typescript
interface Command {
  type: 'record' | 'update' | 'move' | 'query' | 'system';
  confidence: number;
  entities: {
    rat?: number;
    cage?: number;
    weight?: number;
    group?: string;
  };
  needsConfirmation: boolean;
  contextUsed: boolean;
}
```

### 4. Database Layer
**Location**: `src/main/database/`

**Schema**:
```sql
-- Core entities
animals (id, number, current_cage, current_weight, group_id, created_at, updated_at)
cages (id, number, group_name, capacity, created_at)
readings (id, animal_id, weight, cage_id, timestamp, notes, session_id)

-- Session management
sessions (id, start_time, end_time, is_active)
session_context (session_id, last_rat, last_cage, last_weight, updated_at)

-- Audit trail
command_history (id, session_id, raw_text, parsed_command, confidence, executed, timestamp)
```

**Services**:
- `DatabaseManager`: Connection and migration management
- `AnimalRepository`: CRUD operations for animals
- `ReadingRepository`: Weight and measurement operations
- `SessionRepository`: Session and context management

### 5. User Interface
**Location**: `src/renderer/`

**Components**:
- `ChatInterface`: Real-time transcription display
- `DataTable`: Query results and data visualization
- `ControlPanel`: Recording controls and status
- `StatusIndicator`: Microphone and processing status

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [x] Project setup with Electron + TypeScript
- [ ] Basic audio recording pipeline
- [ ] Whisper.cpp integration
- [ ] SQLite database setup
- [ ] Simple command parsing

**MVP Goal**: Record "rat X cage Y weight Z" commands

### Phase 2: Intelligence (Week 3-4)  
- [ ] Context management system
- [ ] Smart confirmation logic
- [ ] Complex command patterns (move, update)
- [ ] Error handling and recovery

**Goal**: Handle context-aware commands like "change weight to 300g"

### Phase 3: Polish (Week 5-6)
- [ ] Query functionality with voice responses
- [ ] Command history and replay
- [ ] Performance optimization
- [ ] Comprehensive testing

**Goal**: Production-ready lab assistant

## Command Examples

### Basic Recording
```
Input: "rat 5 cage 3 weight 280 grams"
Processing: High confidence → Execute immediately
Output: "Logged. Rat 5, cage 3, 280 grams"
```

### Context-Aware Updates
```
Session Context: last_rat = 5
Input: "change weight to 300 grams"
Processing: Use context → rat 5
Output: "Updated rat 5 weight to 300 grams"
```

### Smart Confirmations
```
Input: "move rat 7 to cage 15" (low confidence)  
Processing: Need confirmation
Output: "Did you say move rat 7 to cage 15? Say confirm or cancel"
Input: "confirm"
Output: "Done. Rat 7 moved to cage 15"
```

### Queries
```
Input: "show rats around 300 grams"
Processing: Query database
Output: "Found 3 rats: Rat 5 at 295g, Rat 8 at 305g, Rat 12 at 298g"
```

## Performance Targets
- **Speech Recognition**: < 2 seconds processing time
- **Command Execution**: < 500ms for simple operations
- **Memory Usage**: < 200MB including Whisper model
- **Accuracy**: > 95% for clear speech in quiet environment

## Error Handling Strategy
1. **Audio Issues**: Auto-reconnect devices, fallback recording
2. **Low Confidence**: Voice confirmation loop with retry
3. **Context Missing**: Intelligent prompting for clarification
4. **Database Errors**: Transaction rollback with user notification

## Testing Strategy
- **Unit Tests**: Core business logic and parsing
- **Integration Tests**: Database operations and audio pipeline
- **Manual Testing**: Real lab environment validation
- **Performance Tests**: Memory and processing time benchmarks

## Deployment
- **Target**: Windows 10/11 standalone executable
- **Distribution**: Single .exe file with embedded dependencies
- **Installation**: No admin rights required
- **Updates**: Auto-update mechanism for future versions

## Future Extensions
- **AI Analysis**: Integration with OpenAI API for data insights
- **Team Collaboration**: Shared databases and multi-user support
- **Advanced Queries**: Natural language database exploration
- **Export Options**: CSV, Excel, and report generation