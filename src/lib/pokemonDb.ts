/**
 * pokemonDb.ts
 *
 * SQLite persistence layer for player-owned Pokémon.
 *
 * Tables:
 *   instance_cache — all Pokémon ever caught by the player
 *
 * Supabase is the source of truth for battle stats/images.
 * SQLite tracks ownership, moveset, level, experience, and box/team status.
 *
 * in_team = 1 → active roster (max 6, mirrored to Supabase)
 * in_team = 0 → box (SQLite only)
 */
import type { Pokemon } from "@/src/types/pokemon";
import * as SQLite from "expo-sqlite";

// ─── Singleton DB handle ──────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  const db = await SQLite.openDatabaseAsync("pokemon_cache.db");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    -- Drop old schema to apply column changes
    DROP TABLE IF EXISTS instance_cache;

    CREATE TABLE IF NOT EXISTS instance_cache (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,

      species_id INTEGER,
      name TEXT NOT NULL,

      level INTEGER NOT NULL DEFAULT 0,
      experience INTEGER NOT NULL DEFAULT 0,

      moveset TEXT NOT NULL DEFAULT '[]',

      in_team INTEGER NOT NULL DEFAULT 0,

      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);

  _db = db;
  return db;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type InstanceRow = {
  id: string;
  user_id: string;
  species_id: number | null;
  name: string;
  level: number;
  experience: number;
  moveset: string;
  in_team: number;
  created_at: number;
};

export type BoxEntry = {
  id: string;
  name: string;
  species_id: number | null;
  level: number;
  experience: number;
  moves: Pokemon["moves"];
  inTeam: boolean;
};

// ─── Internal ─────────────────────────────────────────────────────────────────

function rowToBoxEntry(row: InstanceRow): BoxEntry {
  return {
    id: row.id,
    name: row.name,
    species_id: row.species_id,
    level: row.level,
    experience: row.experience,
    moves: JSON.parse(row.moveset ?? "[]"),
    inTeam: row.in_team === 1,
  };
}

// ─── Write helpers ────────────────────────────────────────────────────────────

/**
 * Saves a newly caught Pokémon to SQLite.
 * inTeam=true  → goes straight into the active roster
 * inTeam=false → goes to the box
 */
export async function saveInstanceToDb(
  supabaseId: string,
  userId: string,
  pokemon: Pokemon,
  inTeam: boolean = false,
): Promise<void> {
  const db = await initDb();

  await db.runAsync(
    `INSERT OR REPLACE INTO instance_cache
      (id, user_id, species_id, name, level, experience, moveset, in_team)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      supabaseId,
      userId,
      null,
      pokemon.name,
      pokemon.level ?? 0,
      0,
      JSON.stringify(pokemon.moves),
      inTeam ? 1 : 0,
    ],
  );
}

/**
 * Flips a Pokémon's in_team flag.
 * Bench: setInTeamDb(id, false)
 * Recall: setInTeamDb(id, true)
 */
export async function setInTeamDb(
  supabaseId: string,
  inTeam: boolean,
): Promise<void> {
  const db = await initDb();
  await db.runAsync(`UPDATE instance_cache SET in_team = ? WHERE id = ?`, [
    inTeam ? 1 : 0,
    supabaseId,
  ]);
}

/**
 * Hard deletes a Pokémon from SQLite.
 * Only call this if also deleting from Supabase.
 */
export async function deleteInstanceFromDb(supabaseId: string): Promise<void> {
  const db = await initDb();
  await db.runAsync(`DELETE FROM instance_cache WHERE id = ?`, [supabaseId]);
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

/** All Pokémon ever caught — team + box combined. */
export async function getAllInstancesFromDb(
  userId: string,
): Promise<BoxEntry[]> {
  const db = await initDb();
  const rows = await db.getAllAsync<InstanceRow>(
    `SELECT * FROM instance_cache WHERE user_id = ? ORDER BY created_at ASC`,
    [userId],
  );
  return rows.map(rowToBoxEntry);
}

/** Only the active roster (in_team = 1). */
export async function getTeamFromDb(userId: string): Promise<BoxEntry[]> {
  const db = await initDb();
  const rows = await db.getAllAsync<InstanceRow>(
    `SELECT * FROM instance_cache
     WHERE user_id = ? AND in_team = 1
     ORDER BY created_at ASC`,
    [userId],
  );
  return rows.map(rowToBoxEntry);
}

/** Only boxed Pokémon (in_team = 0). */
export async function getBoxFromDb(userId: string): Promise<BoxEntry[]> {
  const db = await initDb();
  const rows = await db.getAllAsync<InstanceRow>(
    `SELECT * FROM instance_cache
     WHERE user_id = ? AND in_team = 0
     ORDER BY created_at ASC`,
    [userId],
  );
  return rows.map(rowToBoxEntry);
}

/**
 * Set of all caught Pokémon names for a user (lowercased).
 * Cheap lookup for the "already caught" pokeball badge on wild encounters.
 */
export async function getCaughtNamesFromDb(
  userId: string,
): Promise<Set<string>> {
  const db = await initDb();
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM instance_cache WHERE user_id = ?`,
    [userId],
  );
  return new Set(rows.map((r) => r.name.toLowerCase()));
}

/** How many Pokémon are currently in the active roster. */
export async function getTeamCountFromDb(userId: string): Promise<number> {
  const db = await initDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM instance_cache
     WHERE user_id = ? AND in_team = 1`,
    [userId],
  );
  return row?.count ?? 0;
}

// ─── Debug helpers ────────────────────────────────────────────────────────────

export async function getDbStats(): Promise<{
  teamRows: number;
  boxRows: number;
  totalRows: number;
}> {
  const db = await initDb();

  const totalRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM instance_cache",
  );
  const teamRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM instance_cache WHERE in_team = 1",
  );

  const total = totalRow?.count ?? 0;
  const team = teamRow?.count ?? 0;

  return { teamRows: team, boxRows: total - team, totalRows: total };
}

export async function clearDb(): Promise<void> {
  const db = await initDb();
  await db.execAsync("DELETE FROM instance_cache;");
}
