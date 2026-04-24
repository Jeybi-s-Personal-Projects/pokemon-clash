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

import * as SQLite from "expo-sqlite";
import type {
  BaseStats,
  MoveDetail,
  PokemonRawData,
  RawMove,
} from "@/src/encounter/types";

// ─── Singleton DB handle ──────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Opens (or returns the already-open) database and ensures the schema exists.
 * Safe to call multiple times — subsequent calls return the cached handle instantly.
 */
export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  const db = await SQLite.openDatabaseAsync("pokemon_cache.db");

  // WAL mode: faster concurrent reads, safer writes
  await db.execAsync("PRAGMA journal_mode = WAL;");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon_cache (
      id         INTEGER PRIMARY KEY,
      base_stats TEXT    NOT NULL,
      raw_moves  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS move_cache (
      url    TEXT PRIMARY KEY,
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
export async function getPokemonFromDb(
  id: number,
): Promise<PokemonRawData | null> {
  const db = await initDb();

  const row = await db.getFirstAsync<{
    base_stats: string;
    raw_moves: string;
  }>("SELECT base_stats, raw_moves FROM pokemon_cache WHERE id = ?", [id]);

  if (!row) return null;

  try {
    return {
      baseStats: JSON.parse(row.base_stats) as BaseStats,
      rawMoves: JSON.parse(row.raw_moves) as RawMove[],
    };
  } catch {
    // Corrupted row — treat as miss so the caller re-fetches and overwrites
    return null;
  }
}

/**
 * Writes a PokemonRawData to SQLite.
 * INSERT OR REPLACE is idempotent — safe to call even if the row already exists.
 */
export async function savePokemonToDb(
  id: number,
  data: PokemonRawData,
): Promise<void> {
  const db = await initDb();

  await db.runAsync(
    `INSERT OR REPLACE INTO pokemon_cache (id, base_stats, raw_moves)
     VALUES (?, ?, ?)`,
    [id, JSON.stringify(data.baseStats), JSON.stringify(data.rawMoves)],
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
