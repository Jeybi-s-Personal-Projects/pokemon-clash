/**
 * pokemonDb.ts
 *
 * SQLite persistence layer for PokeAPI data.
 * Two tables:
 *   pokemon_cache  — keyed by numeric Pokémon id, stores BaseStats + RawMove[]
 *   move_cache     — keyed by move URL, stores full MoveDetail
 *
 * Both tables are append-only from the app's perspective (base stats and move
 * details don't change between sessions, so data never goes stale).
 *
 * Usage: call initDb() once at app startup (e.g. in App.tsx), then the
 * read/write helpers are used internally by fetchWithCache.ts.
 */
import type { MoveDetail, PokemonRawData } from "@/src/encounter/types";
// import * as FileSystem from "expo-file-system";
// import { Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";

// ─── Singleton DB handle ──────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Opens (or returns the already-open) database and ensures the schema exists.
 * Safe to call multiple times — subsequent calls return the cached handle instantly.
 */
export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  // 🔥 TEMP: wipe DB once
  // await FileSystem.deleteAsync(Paths.document + "SQLite/pokemon_cache.db", {
  //   idempotent: true,
  // });

  const db = await SQLite.openDatabaseAsync("pokemon_cache.db");

  // WAL mode: faster concurrent reads, safer writes
  await db.execAsync("PRAGMA journal_mode = WAL;");

  await db.execAsync(`
  PRAGMA journal_mode = WAL;

  -- 🟦 POKEDEX / GLOBAL DATA
  CREATE TABLE IF NOT EXISTS species_cache (
    id INTEGER PRIMARY KEY,

    name TEXT NOT NULL,
    types TEXT NOT NULL,

    base_stats TEXT NOT NULL,
    abilities TEXT,

    evolution_chain TEXT,
    genus TEXT,
    flavor_texts TEXT,

    sprite_default TEXT,
    sprite_shiny TEXT,

    height_m REAL,
    weight_kg REAL,

    capture_rate INTEGER,
    encounter_rate INTEGER,

    last_updated INTEGER
  );

  -- 🟨 PLAYER OWNED POKEMON
  CREATE TABLE IF NOT EXISTS instance_cache (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,

    species_id INTEGER NOT NULL,

    nickname TEXT,
    level INTEGER NOT NULL DEFAULT 5,
    xp INTEGER DEFAULT 0,

    is_shiny INTEGER DEFAULT 0,

    hp_current INTEGER NOT NULL,
    hp_max INTEGER NOT NULL,

    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    sp_attack INTEGER NOT NULL,
    sp_defense INTEGER NOT NULL,
    speed INTEGER NOT NULL,

    moveset TEXT,
    held_item TEXT,

    status TEXT,

    team_slot INTEGER,
    in_team INTEGER DEFAULT 0,

    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  -- ⚔️ MOVES (UNCHANGED)
  CREATE TABLE IF NOT EXISTS move_cache (
    url TEXT PRIMARY KEY,
    detail TEXT NOT NULL
  );
`);

  _db = db;
  return db;
}

// ─── Pokémon helpers ──────────────────────────────────────────────────────────

/**
 * Reads a PokemonRawData from SQLite by Pokémon id.
 * Returns null on miss or corrupted JSON (triggers a re-fetch upstream).
 */

export async function getSpeciesFromDb(
  id: number,
): Promise<PokemonRawData | null> {
  const db = await initDb();

  const row = await db.getFirstAsync<{
    base_stats: string;
    types: string;
    name: string;
  }>(`SELECT base_stats, types, name FROM species_cache WHERE id = ?`, [id]);

  if (!row) return null;

  try {
    return {
      baseStats: JSON.parse(row.base_stats),
      rawMoves: [], // moves handled separately now
    };
  } catch {
    return null;
  }
}
/**
 * Writes a PokemonRawData to SQLite.
 * INSERT OR REPLACE is idempotent — safe to call even if the row already exists.
 */
export async function saveSpeciesToDb(
  id: number,
  data: PokemonRawData,
  extra?: {
    name?: string;
    types?: string[];
  },
): Promise<void> {
  const db = await initDb();

  await db.runAsync(
    `INSERT OR REPLACE INTO species_cache
     (id, name, types, base_stats)
     VALUES (?, ?, ?, ?)`,
    [
      id,
      extra?.name ?? `pokemon-${id}`,
      JSON.stringify(extra?.types ?? ["normal"]),
      JSON.stringify(data.baseStats),
    ],
  );
}

// ─── Move helpers ─────────────────────────────────────────────────────────────

/**
 * Reads a MoveDetail from SQLite by move URL.
 * Returns null on miss or corrupted JSON.
 */
export async function getMoveFromDb(url: string): Promise<MoveDetail | null> {
  const db = await initDb();

  const row = await db.getFirstAsync<{ detail: string }>(
    "SELECT detail FROM move_cache WHERE url = ?",
    [url],
  );

  if (!row) return null;

  try {
    return JSON.parse(row.detail) as MoveDetail;
  } catch {
    return null;
  }
}

/**
 * Writes a MoveDetail to SQLite keyed by its URL.
 * INSERT OR REPLACE is idempotent.
 */
export async function saveMoveToDb(
  url: string,
  detail: MoveDetail,
): Promise<void> {
  const db = await initDb();

  await db.runAsync(
    `INSERT OR REPLACE INTO move_cache (url, detail) VALUES (?, ?)`,
    [url, JSON.stringify(detail)],
  );
}

// ─── Debug helpers ────────────────────────────────────────────────────────────

/** Returns row counts for both tables — handy for a dev/settings screen. */
export async function getDbStats(): Promise<{
  pokemonRows: number;
  moveRows: number;
}> {
  const db = await initDb();

  const pkRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pokemon_cache",
  );
  const mvRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM move_cache",
  );

  return {
    pokemonRows: pkRow?.count ?? 0,
    moveRows: mvRow?.count ?? 0,
  };
}

/** Wipes all cached rows — useful for a "clear cache" option. */
export async function clearDb(): Promise<void> {
  const db = await initDb();
  await db.execAsync("DELETE FROM pokemon_cache; DELETE FROM move_cache;");
}
