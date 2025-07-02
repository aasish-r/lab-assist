"use strict";
/**
 * Database Manager - Handles SQLite database operations
 * Provides connection management, migrations, and basic CRUD operations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const app_config_1 = require("../../shared/app-config");
class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = null;
        // Database path will be set during initialization
    }
    getDbPath() {
        if (!this.dbPath) {
            // Use centralized database path configuration
            this.dbPath = (0, app_config_1.getDatabasePath)();
        }
        return this.dbPath;
    }
    /**
     * Initialize database connection and run migrations
     */
    async initialize() {
        try {
            // Get the database path (this will set it if not already set)
            const dbPath = this.getDbPath();
            // Ensure directory exists
            const dbDir = path.dirname(dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }
            // Open database connection
            try {
                this.db = new better_sqlite3_1.default(dbPath);
            }
            catch (nativeError) {
                throw new Error(`Native SQLite module failed to load. This might be due to missing native dependencies or incompatible binaries. Error: ${nativeError.message}`);
            }
            const config = (0, app_config_1.loadConfig)();
            // Apply database configuration pragmas
            this.db.pragma(`foreign_keys = ${config.database.pragmas.foreignKeys ? 'ON' : 'OFF'}`);
            this.db.pragma(`journal_mode = ${config.database.pragmas.journalMode}`);
            this.db.pragma(`synchronous = ${config.database.pragmas.synchronous}`);
            // Run migrations
            await this.runMigrations();
            console.log(`Database initialized at: ${dbPath}`);
        }
        catch (error) {
            throw new Error(`Failed to initialize database: ${error.message}`);
        }
    }
    /**
     * Run database migrations to create/update schema
     */
    async runMigrations() {
        if (!this.db)
            throw new Error('Database not initialized');
        // Create tables if they don't exist
        const migrations = [
            // Core entities
            `CREATE TABLE IF NOT EXISTS animals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number INTEGER UNIQUE NOT NULL,
        current_cage INTEGER,
        current_weight REAL,
        group_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS cages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number INTEGER UNIQUE NOT NULL,
        group_name TEXT,
        capacity INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        animal_id INTEGER NOT NULL,
        weight REAL NOT NULL,
        cage_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        session_id INTEGER NOT NULL,
        FOREIGN KEY (animal_id) REFERENCES animals(id),
        FOREIGN KEY (cage_id) REFERENCES cages(id),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )`,
            // Session management
            `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,
            `CREATE TABLE IF NOT EXISTS session_context (
        session_id INTEGER PRIMARY KEY,
        last_rat INTEGER,
        last_cage INTEGER,
        last_weight REAL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )`,
            // Command audit trail
            `CREATE TABLE IF NOT EXISTS command_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        raw_text TEXT NOT NULL,
        parsed_command TEXT,
        confidence REAL,
        executed BOOLEAN DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )`,
            // Indexes for performance
            `CREATE INDEX IF NOT EXISTS idx_animals_number ON animals(number)`,
            `CREATE INDEX IF NOT EXISTS idx_cages_number ON cages(number)`,
            `CREATE INDEX IF NOT EXISTS idx_readings_animal_id ON readings(animal_id)`,
            `CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp)`,
            `CREATE INDEX IF NOT EXISTS idx_command_history_session ON command_history(session_id)`
        ];
        // Execute migrations
        for (const migration of migrations) {
            this.db.exec(migration);
        }
        // Create update trigger for animals table
        this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_animals_timestamp 
      AFTER UPDATE ON animals
      BEGIN
        UPDATE animals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);
    }
    /**
     * Get or create an animal by number
     */
    async getOrCreateAnimal(number) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare('SELECT * FROM animals WHERE number = ?');
        let animal = stmt.get(number);
        if (!animal) {
            const insertStmt = this.db.prepare(`
        INSERT INTO animals (number) VALUES (?)
      `);
            const result = insertStmt.run(number);
            const selectStmt = this.db.prepare('SELECT * FROM animals WHERE id = ?');
            animal = selectStmt.get(result.lastInsertRowid);
        }
        return this.mapToAnimal(animal);
    }
    /**
     * Get or create a cage by number
     */
    async getOrCreateCage(number) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare('SELECT * FROM cages WHERE number = ?');
        let cage = stmt.get(number);
        if (!cage) {
            const insertStmt = this.db.prepare(`
        INSERT INTO cages (number) VALUES (?)
      `);
            const result = insertStmt.run(number);
            const selectStmt = this.db.prepare('SELECT * FROM cages WHERE id = ?');
            cage = selectStmt.get(result.lastInsertRowid);
        }
        return this.mapToCage(cage);
    }
    /**
     * Record a new reading and update animal's current status
     */
    async recordReading(animalNumber, cageNumber, weight, sessionId) {
        if (!this.db)
            throw new Error('Database not initialized');
        const transaction = this.db.transaction(() => {
            // Get or create animal and cage
            const animal = this.db.prepare('SELECT * FROM animals WHERE number = ?').get(animalNumber);
            const cage = this.db.prepare('SELECT * FROM cages WHERE number = ?').get(cageNumber);
            if (!animal || !cage) {
                throw new Error(`Animal ${animalNumber} or cage ${cageNumber} not found`);
            }
            // Insert reading
            const insertReading = this.db.prepare(`
        INSERT INTO readings (animal_id, weight, cage_id, session_id)
        VALUES (?, ?, ?, ?)
      `);
            const readingResult = insertReading.run(animal.id, weight, cage.id, sessionId);
            // Update animal's current status
            const updateAnimal = this.db.prepare(`
        UPDATE animals 
        SET current_cage = ?, current_weight = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
            updateAnimal.run(cageNumber, weight, animal.id);
            // Get the inserted reading
            const selectReading = this.db.prepare('SELECT * FROM readings WHERE id = ?');
            return selectReading.get(readingResult.lastInsertRowid);
        });
        const reading = transaction();
        return this.mapToReading(reading);
    }
    /**
     * Update an animal's current weight
     */
    async updateAnimalWeight(animalNumber, newWeight, sessionId) {
        if (!this.db)
            throw new Error('Database not initialized');
        const transaction = this.db.transaction(() => {
            // Get animal
            const animal = this.db.prepare('SELECT * FROM animals WHERE number = ?').get(animalNumber);
            if (!animal) {
                throw new Error(`Animal ${animalNumber} not found`);
            }
            // Update animal weight
            const updateStmt = this.db.prepare(`
        UPDATE animals 
        SET current_weight = ?, updated_at = CURRENT_TIMESTAMP
        WHERE number = ?
      `);
            updateStmt.run(newWeight, animalNumber);
            // Record this as a reading if animal has a current cage
            if (animal.current_cage) {
                const cage = this.db.prepare('SELECT * FROM cages WHERE number = ?').get(animal.current_cage);
                if (cage) {
                    const insertReading = this.db.prepare(`
            INSERT INTO readings (animal_id, weight, cage_id, session_id, notes)
            VALUES (?, ?, ?, ?, 'Weight updated')
          `);
                    insertReading.run(animal.id, newWeight, cage.id, sessionId);
                }
            }
        });
        transaction();
    }
    /**
     * Move an animal to a different cage
     */
    async moveAnimal(animalNumber, newCageNumber) {
        if (!this.db)
            throw new Error('Database not initialized');
        const updateStmt = this.db.prepare(`
      UPDATE animals 
      SET current_cage = ?, updated_at = CURRENT_TIMESTAMP
      WHERE number = ?
    `);
        updateStmt.run(newCageNumber, animalNumber);
    }
    /**
     * Get animals with weight around a target (±tolerance)
     */
    async getAnimalsAroundWeight(targetWeight, tolerance = 20) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare(`
      SELECT * FROM animals 
      WHERE current_weight BETWEEN ? AND ?
      ORDER BY ABS(current_weight - ?) ASC
    `);
        const animals = stmt.all(targetWeight - tolerance, targetWeight + tolerance, targetWeight);
        return animals.map(this.mapToAnimal);
    }
    /**
     * Start a new session
     */
    async startSession() {
        if (!this.db)
            throw new Error('Database not initialized');
        // End any active sessions first
        this.db.prepare('UPDATE sessions SET is_active = 0, end_time = CURRENT_TIMESTAMP WHERE is_active = 1').run();
        // Create new session
        const insertStmt = this.db.prepare('INSERT INTO sessions DEFAULT VALUES');
        const result = insertStmt.run();
        const selectStmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
        const session = selectStmt.get(result.lastInsertRowid);
        return this.mapToSession(session);
    }
    /**
     * Get current active session
     */
    async getCurrentSession() {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare('SELECT * FROM sessions WHERE is_active = 1 LIMIT 1');
        const session = stmt.get();
        return session ? this.mapToSession(session) : null;
    }
    /**
     * Update session context
     */
    async updateSessionContext(sessionId, context) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare(`
      INSERT INTO session_context (session_id, last_rat, last_cage, last_weight, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(session_id) DO UPDATE SET
        last_rat = COALESCE(excluded.last_rat, last_rat),
        last_cage = COALESCE(excluded.last_cage, last_cage),
        last_weight = COALESCE(excluded.last_weight, last_weight),
        updated_at = CURRENT_TIMESTAMP
    `);
        stmt.run(sessionId, context.lastRat || null, context.lastCage || null, context.lastWeight || null);
    }
    /**
     * Get session context
     */
    async getSessionContext(sessionId) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare('SELECT * FROM session_context WHERE session_id = ?');
        const context = stmt.get(sessionId);
        return context ? this.mapToSessionContext(context) : null;
    }
    /**
     * Log a command to history
     */
    async logCommand(sessionId, rawText, parsedCommand, confidence, executed) {
        if (!this.db)
            throw new Error('Database not initialized');
        // Ensure all parameters are primitive types
        const safeParams = [
            typeof sessionId === 'number' ? sessionId : 0,
            typeof rawText === 'string' ? rawText : '',
            typeof parsedCommand === 'string' ? parsedCommand : '',
            typeof confidence === 'number' ? confidence : 0,
            typeof executed === 'boolean' ? executed : false
        ];
        const stmt = this.db.prepare(`
      INSERT INTO command_history (session_id, raw_text, parsed_command, confidence, executed)
      VALUES (?, ?, ?, ?, ?)
    `);
        stmt.run(...safeParams);
    }
    /**
     * Close database connection
     */
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    // Helper methods to map database rows to TypeScript objects
    mapToAnimal(row) {
        return {
            id: row.id,
            number: row.number,
            currentCage: row.current_cage,
            currentWeight: row.current_weight,
            groupId: row.group_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
    mapToCage(row) {
        return {
            id: row.id,
            number: row.number,
            groupName: row.group_name,
            capacity: row.capacity,
            createdAt: new Date(row.created_at)
        };
    }
    mapToReading(row) {
        return {
            id: row.id,
            animalId: row.animal_id,
            weight: row.weight,
            cageId: row.cage_id,
            timestamp: new Date(row.timestamp),
            notes: row.notes,
            sessionId: row.session_id
        };
    }
    mapToSession(row) {
        return {
            id: row.id,
            startTime: new Date(row.start_time),
            endTime: row.end_time ? new Date(row.end_time) : null,
            isActive: Boolean(row.is_active)
        };
    }
    mapToSessionContext(row) {
        return {
            sessionId: row.session_id,
            lastRat: row.last_rat,
            lastCage: row.last_cage,
            lastWeight: row.last_weight,
            updatedAt: new Date(row.updated_at)
        };
    }
}
exports.DatabaseManager = DatabaseManager;
