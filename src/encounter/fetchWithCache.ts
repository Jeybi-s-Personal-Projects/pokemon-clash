/**
 * fetchWithCache.ts  (upgraded — SQLite-backed)
 *
 * Three-layer cache for every PokeAPI resource:
 *
 *   L1 — in-memory Map  (instant, lost on app close)
 *   L2 — SQLite DB      (fast, survives app restarts)
 *   L3 — PokeAPI        (network, last resort)
 *
 * Public API is identical to the original file — nothing upstream changes.
 */

import type {
  BaseStats,
  MoveDetail,
  PokemonRawData,
} from "@/src/encounter/types";
import {
  getMoveFromDb,
  getPokemonFromDb,
  saveMoveToDb,
  savePokemonToDb,
} from "@/src/lib/pokemonDb";
import { parseRawMoves } from "@/src/utils/moveSelector";

// ─── Constants ────────────────────────────────────────────────────────────────

const POKE_API_BASE = "https://pokeapi.co/api/v2";
const FETCH_TIMEOUT_MS = 3000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [500, 1000, 2000];

// ─── L1 — in-memory cache ─────────────────────────────────────────────────────

/** Session-level L1: avoids even a SQLite read for repeated same-session hits */
const pokemonCache = new Map<number, PokemonRawData>();
const moveCache = new Map<string, MoveDetail>();

/** In-flight deduplication — same promise joined by concurrent callers */
const pendingFetches = new Map<number, Promise<PokemonRawData>>();
const pendingMoveFetches = new Map<string, Promise<MoveDetail>>();

// ─── Fallback data ────────────────────────────────────────────────────────────

export function buildFallback(): PokemonRawData {
  return {
    baseStats: {
      hp: 45,
      attack: 40,
      defense: 40,
      spAttack: 40,
      spDefense: 40,
      speed: 40,
    },
    rawMoves: [],
  };
}

export function buildMoveFallback(name: string): MoveDetail {
  return {
    name,
    power: 0,
    accuracy: 100,
    pp: 35,
    type: "normal",
    damageClass: "physical",
    effectChance: null,
    statChanges: [],
    description: "",
    priority: -7,
  };
}

// ─── Internal parsers ─────────────────────────────────────────────────────────

function parseStats(apiStats: any[]): BaseStats {
  const get = (name: string) =>
    apiStats.find((s: any) => s.stat.name === name)?.base_stat ?? 40;

  return {
    hp: get("hp"),
    attack: get("attack"),
    defense: get("defense"),
    spAttack: get("special-attack"),
    spDefense: get("special-defense"),
    speed: get("speed"),
  };
}

function parseMoveDetail(data: any): MoveDetail {
  const englishEffect = data.effect_entries.find(
    (e: any) => e.language.name === "en",
  );
  return {
    name: data.name,
    power: data.power,
    accuracy: data.accuracy,
    pp: data.pp,
    type: data.type.name,
    damageClass: data.damage_class.name,
    effectChance: data.effect_chance,
    statChanges: data.stat_changes.map((sc: any) => ({
      stat: sc.stat.name,
      change: sc.change,
    })),
    description: englishEffect?.short_effect ?? null,
    priority: data.priority,
  };
}

// ─── Network helpers ──────────────────────────────────────────────────────────

async function attemptFetch(id: number): Promise<PokemonRawData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${POKE_API_BASE}/pokemon/${id}`, {
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`PokeAPI returned ${res.status} for id ${id}`);

    const data = await res.json();
    return {
      baseStats: parseStats(data.stats),
      rawMoves: parseRawMoves(data.moves),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function attemptMoveFetch(
  url: string,
  name: string,
): Promise<MoveDetail> {
  if (!url) return buildMoveFallback(name);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok)
      throw new Error(`PokeAPI returned ${res.status} for move url ${url}`);

    const data = await res.json();
    return parseMoveDetail(data);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(id: number): Promise<PokemonRawData> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await attemptFetch(id);
    } catch {
      if (attempt === MAX_RETRIES - 1) break;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] ?? 2000));
    }
  }
  console.warn(
    `[fetchWithCache] All retries exhausted for id ${id}. Using fallback.`,
  );
  return buildFallback();
}

async function fetchMoveWithRetry(
  url: string,
  name: string,
): Promise<MoveDetail> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await attemptMoveFetch(url, name);
    } catch {
      if (attempt === MAX_RETRIES - 1) break;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] ?? 2000));
    }
  }
  console.warn(
    `[fetchWithCache] All retries exhausted for move ${name}. Using fallback.`,
  );
  return buildMoveFallback(name);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches PokemonRawData for a given id.
 *
 * Resolution order:
 *   1. L1 in-memory Map  → return immediately
 *   2. L2 SQLite DB      → populate L1, return
 *   3. L3 PokeAPI        → persist to L2, populate L1, return
 */
export async function fetchWithCache(id: number): Promise<PokemonRawData> {
  // L1 hit
  if (pokemonCache.has(id)) return pokemonCache.get(id)!;

  // In-flight deduplication
  if (pendingFetches.has(id)) return pendingFetches.get(id)!;

  const fetchPromise = (async (): Promise<PokemonRawData> => {
    // L2 hit — SQLite
    const cached = await getPokemonFromDb(id);
    if (cached) {
      pokemonCache.set(id, cached); // warm L1
      return cached;
    }

    // L3 — network
    const fresh = await fetchWithRetry(id);
    pokemonCache.set(id, fresh);

    // Persist to SQLite in the background — don't block the caller
    savePokemonToDb(id, fresh).catch((err) =>
      console.warn(`[fetchWithCache] SQLite write failed for id ${id}:`, err),
    );

    return fresh;
  })().finally(() => pendingFetches.delete(id));

  pendingFetches.set(id, fetchPromise);
  return fetchPromise;
}

/**
 * Fetches a MoveDetail for a given URL.
 *
 * Resolution order:
 *   1. L1 in-memory Map
 *   2. L2 SQLite DB
 *   3. L3 PokeAPI
 */
export async function fetchMoveWithCache(
  url: string,
  name: string,
): Promise<MoveDetail> {
  // L1 hit
  if (moveCache.has(url)) return moveCache.get(url)!;

  // In-flight deduplication
  if (pendingMoveFetches.has(url)) return pendingMoveFetches.get(url)!;

  const fetchPromise = (async (): Promise<MoveDetail> => {
    // L2 hit — SQLite
    const cached = await getMoveFromDb(url);
    if (cached) {
      moveCache.set(url, cached); // warm L1
      return cached;
    }

    // L3 — network
    const fresh = await fetchMoveWithRetry(url, name);
    moveCache.set(url, fresh);

    // Persist to SQLite in the background
    saveMoveToDb(url, fresh).catch((err) =>
      console.warn(
        `[fetchWithCache] SQLite write failed for move ${name}:`,
        err,
      ),
    );

    return fresh;
  })().finally(() => pendingMoveFetches.delete(url));

  pendingMoveFetches.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Fetches a batch of ids — each goes through the full L1/L2/L3 chain.
 * Uses Promise.allSettled so one failure never kills the batch.
 */
export async function fetchBatch(
  ids: number[],
): Promise<Map<number, PokemonRawData>> {
  const results = await Promise.allSettled(
    ids.map((id) => fetchWithCache(id).then((data) => ({ id, data }))),
  );

  const map = new Map<number, PokemonRawData>();
  for (const result of results) {
    if (result.status === "fulfilled") {
      map.set(result.value.id, result.value.data);
    }
  }
  return map;
}

/**
 * Fetches full details for multiple moves in parallel.
 */
export async function fetchMoveBatch(
  moves: { name: string; url: string }[],
): Promise<MoveDetail[]> {
  const results = await Promise.allSettled(
    moves.map((m) => fetchMoveWithCache(m.url, m.name)),
  );

  return results.map((res, i) => {
    if (res.status === "fulfilled") return res.value;
    return buildMoveFallback(moves[i].name);
  });
}

/** Returns combined L1 cache size (session only). */
export function getCacheSize(): number {
  return pokemonCache.size + moveCache.size;
}

/**
 * Clears L1 in-memory caches.
 * To also clear L2 (SQLite), call clearDb() from pokemonDb.ts separately.
 */
export function clearCache(): void {
  pokemonCache.clear();
  moveCache.clear();
  pendingFetches.clear();
  pendingMoveFetches.clear();
}
