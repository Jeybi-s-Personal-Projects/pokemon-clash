import * as SQLite from 'expo-sqlite';

/**
 * db.ts — Local SQLite Database Initialization & Helpers
 * 
 * This file replaces the core Pokémon data persistence from Supabase.
 * We maintain the same schema structure to minimize refactoring in hooks.
 */

// Open or create the database
const db = SQLite.openDatabaseSync('pokemon.db');

export const initDatabase = () => {
  // Create Pokemon Table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS pokemon (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      pk_species_id INTEGER,
      pk_name TEXT NOT NULL,
      pk_level INTEGER DEFAULT 1,
      pk_experience INTEGER DEFAULT 0,
      pk_hp INTEGER NOT NULL,
      pk_max_hp INTEGER NOT NULL,
      pk_attack INTEGER DEFAULT 0,
      pk_defense INTEGER DEFAULT 0,
      pk_special_attack INTEGER DEFAULT 0,
      pk_special_defense INTEGER DEFAULT 0,
      pk_speed INTEGER DEFAULT 0,
      pk_types TEXT NOT NULL, -- JSON stringified array
      pk_ability TEXT,
      pk_held_item TEXT,
      pk_front_image TEXT,
      pk_back_image TEXT,
      pk_is_shiny INTEGER DEFAULT 0, -- 0 for false, 1 for true
      pk_cry TEXT,
      pk_order INTEGER, -- NULL for boxed, 1-6 for team
      pk_pk_order INTEGER DEFAULT 0, -- Legacy support if needed
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Pokemon Moves Table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS pokemon_moves (
      id TEXT PRIMARY KEY,
      pokemon_id TEXT NOT NULL,
      move_name TEXT NOT NULL,
      move_power INTEGER DEFAULT 0,
      move_pp INTEGER DEFAULT 0,
      move_type TEXT DEFAULT 'normal',
      move_damageClass TEXT DEFAULT 'status',
      move_accuracy INTEGER DEFAULT 100,
      move_statChanges TEXT, -- JSON stringified
      move_description TEXT,
      move_priority INTEGER DEFAULT 0,
      FOREIGN KEY (pokemon_id) REFERENCES pokemon (id) ON DELETE CASCADE
    );
  `);

  console.log('Local SQLite Database initialized successfully.');
};

// Export the database instance for use in other files
export default db;
