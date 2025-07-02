/**
 * Database Manager - Handles SQLite database operations
 * Provides connection management, migrations, and basic CRUD operations
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { Animal, Cage, Reading, Session, SessionContext } from '../../shared/types';
import { getDatabasePath, loadConfig } from '../../shared/app-config';

export class DatabaseManager {
  private db: Database.Database | null = null;
private dbPath: string | null = null;

  constructor() {
    // Database path will be set during initialization
  }

  private getDbPath(): string {
    if (!this.dbPath) {
      // Use centralized database path configuration
      this.dbPath = getDatabasePath();
    }
    return this.dbPath;
  }

  /**
   * Initialize database connection and run migrations
   */
  async initialize(): Promise<void> {
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
        this.db = new Database(dbPath);
      } catch (nativeError) {
        throw new Error(`Native SQLite module failed to load. This might be due to missing native dependencies or incompatible binaries. Error: ${nativeError.message}`);
      }
      
      const config = loadConfig();
      
      // Apply database configuration pragmas
      this.db.pragma(`foreign_keys = ${config.database.pragmas.foreignKeys ? 'ON' : 'OFF'}`);
      this.db.pragma(`journal_mode = ${config.database.pragmas.journalMode}`);
      this.db.pragma(`synchronous = ${config.database.pragmas.synchronous}`);

      // Run migrations
      await this.runMigrations();

      console.log(`Database initialized at: ${dbPath}`);
    } catch (error) {
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  /**
   * Run database migrations to create/update schema
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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
  async getOrCreateAnimal(number: number): Promise<Animal> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM animals WHERE number = ?');
    let animal = stmt.get(number) as any;

    if (!animal) {
      const insertStmt = this.db.prepare(`
        INSERT INTO animals (number) VALUES (?)
      `);
      const result = insertStmt.run(number);
      
      const selectStmt = this.db.prepare('SELECT * FROM animals WHERE id = ?');
      animal = selectStmt.get(result.lastInsertRowid) as any;
    }

    return this.mapToAnimal(animal);
  }

  /**
   * Get or create a cage by number
   */
  async getOrCreateCage(number: number): Promise<Cage> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM cages WHERE number = ?');
    let cage = stmt.get(number) as any;

    if (!cage) {
      const insertStmt = this.db.prepare(`
        INSERT INTO cages (number) VALUES (?)
      `);
      const result = insertStmt.run(number);
      
      const selectStmt = this.db.prepare('SELECT * FROM cages WHERE id = ?');
      cage = selectStmt.get(result.lastInsertRowid) as any;
    }

    return this.mapToCage(cage);
  }

  /**
   * Record a new reading and update animal's current status
   */
  async recordReading(animalNumber: number, cageNumber: number, weight: number, sessionId: number): Promise<Reading> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(() => {
      // Get or create animal and cage
      const animal = this.db.prepare('SELECT * FROM animals WHERE number = ?').get(animalNumber) as any;
      const cage = this.db.prepare('SELECT * FROM cages WHERE number = ?').get(cageNumber) as any;

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
      return selectReading.get(readingResult.lastInsertRowid) as any;
    });

    const reading = transaction();
    return this.mapToReading(reading);
  }

  /**
   * Update an animal's current weight
   */
  async updateAnimalWeight(animalNumber: number, newWeight: number, sessionId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(() => {
      // Get animal
      const animal = this.db.prepare('SELECT * FROM animals WHERE number = ?').get(animalNumber) as any;
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
        const cage = this.db.prepare('SELECT * FROM cages WHERE number = ?').get(animal.current_cage) as any;
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
  async moveAnimal(animalNumber: number, newCageNumber: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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
  async getAnimalsAroundWeight(targetWeight: number, tolerance: number = 20): Promise<Animal[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM animals 
      WHERE current_weight BETWEEN ? AND ?
      ORDER BY ABS(current_weight - ?) ASC
    `);
    
    const animals = stmt.all(
      targetWeight - tolerance,
      targetWeight + tolerance,
      targetWeight
    ) as any[];

    return animals.map(this.mapToAnimal);
  }

  /**
   * Start a new session
   */
  async startSession(): Promise<Session> {
    if (!this.db) throw new Error('Database not initialized');

    // End any active sessions first
    this.db.prepare('UPDATE sessions SET is_active = 0, end_time = CURRENT_TIMESTAMP WHERE is_active = 1').run();

    // Create new session
    const insertStmt = this.db.prepare('INSERT INTO sessions DEFAULT VALUES');
    const result = insertStmt.run();

    const selectStmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const session = selectStmt.get(result.lastInsertRowid) as any;

    return this.mapToSession(session);
  }

  /**
   * Get current active session
   */
  async getCurrentSession(): Promise<Session | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM sessions WHERE is_active = 1 LIMIT 1');
    const session = stmt.get() as any;

    return session ? this.mapToSession(session) : null;
  }

  /**
   * Update session context
   */
  async updateSessionContext(sessionId: number, context: Partial<SessionContext>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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
  async getSessionContext(sessionId: number): Promise<SessionContext | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM session_context WHERE session_id = ?');
    const context = stmt.get(sessionId) as any;

    return context ? this.mapToSessionContext(context) : null;
  }

  /**
   * Log a command to history
   */
  async logCommand(sessionId: number, rawText: string, parsedCommand: string, confidence: number, executed: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Helper methods to map database rows to TypeScript objects
  private mapToAnimal(row: any): Animal {
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

  private mapToCage(row: any): Cage {
    return {
      id: row.id,
      number: row.number,
      groupName: row.group_name,
      capacity: row.capacity,
      createdAt: new Date(row.created_at)
    };
  }

  private mapToReading(row: any): Reading {
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

  private mapToSession(row: any): Session {
    return {
      id: row.id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : null,
      isActive: Boolean(row.is_active)
    };
  }

  private mapToSessionContext(row: any): SessionContext {
    return {
      sessionId: row.session_id,
      lastRat: row.last_rat,
      lastCage: row.last_cage,
      lastWeight: row.last_weight,
      updatedAt: new Date(row.updated_at)
    };
  }
}