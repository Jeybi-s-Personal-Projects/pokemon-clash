import type {
  BaseStats,
  MoveDetail,
  PokemonRawData,
} from "@/src/encounter/types";
import { parseRawMoves } from "@/src/utils/moveSelector";

// ─── Constants ────────────────────────────────────────────────────────────────

const POKE_API_BASE = "https://pokeapi.co/api/v2";
const FETCH_TIMEOUT_MS = 3000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [500, 1000, 2000];

// ─── Cache layer ──────────────────────────────────────────────────────────────

/** Permanent store: id → resolved raw data */
const pokemonCache = new Map<number, PokemonRawData>();

/** Permanent store: moveUrl → resolved move detail */
const moveCache = new Map<string, MoveDetail>();

/**
 * Promise registry: id → in-flight promise.
 * Any concurrent call for the same id joins this promise
 * instead of firing a new network request.
 */
const pendingFetches = new Map<number, Promise<PokemonRawData>>();

/** Promise registry for move details */
const pendingMoveFetches = new Map<string, Promise<MoveDetail>>();

// ─── Fallback data ────────────────────────────────────────────────────────────

/**
 * Used when all retries are exhausted.
 * Produces a minimal valid PokemonRawData so the battle screen
 * never receives undefined. Stats are deliberately weak/neutral.
 */
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

// ─── Internal helpers ─────────────────────────────────────────────────────────

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

/**
 * Single fetch attempt with AbortController timeout.
 * Throws on network error, non-200 response, or timeout.
 */
async function attemptFetch(id: number): Promise<PokemonRawData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${POKE_API_BASE}/pokemon/${id}`, {
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`PokeAPI returned ${res.status} for id ${id}`);
    }

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
    const res = await fetch(url, {
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`PokeAPI returned ${res.status} for move url ${url}`);
    }

    const data = await res.json();
    return parseMoveDetail(data);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Retries up to MAX_RETRIES times with exponential-ish backoff.
 * Falls back to buildFallback() if all attempts fail.
 */
async function fetchWithRetry(id: number): Promise<PokemonRawData> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await attemptFetch(id);
    } catch (err) {
      const isLast = attempt === MAX_RETRIES - 1;
      if (isLast) break;

      const delay = RETRY_DELAYS_MS[attempt] ?? 2000;
      await new Promise((r) => setTimeout(r, delay));
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
    } catch (err) {
      const isLast = attempt === MAX_RETRIES - 1;
      if (isLast) break;

      const delay = RETRY_DELAYS_MS[attempt] ?? 2000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  console.warn(
    `[fetchWithCache] All retries exhausted for move ${name}. Using fallback.`,
  );
  return buildMoveFallback(name);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * The main cache-aware fetch function.
 */
export async function fetchWithCache(id: number): Promise<PokemonRawData> {
  // 1. Cache hit
  if (pokemonCache.has(id)) return pokemonCache.get(id)!;

  // 2. In-flight hit — join the existing promise
  if (pendingFetches.has(id)) return pendingFetches.get(id)!;

  // 3. New fetch — register BEFORE awaiting
  const fetchPromise = fetchWithRetry(id)
    .then((data) => {
      pokemonCache.set(id, data);
      return data;
    })
    .finally(() => {
      // Clean up registry whether success or fallback
      pendingFetches.delete(id);
    });

  pendingFetches.set(id, fetchPromise);
  return fetchPromise;
}

/**
 * Fetches detail for a single move with caching and deduplication.
 */
export async function fetchMoveWithCache(
  url: string,
  name: string,
): Promise<MoveDetail> {
  // 1. Cache hit
  if (moveCache.has(url)) return moveCache.get(url)!;

  // 2. In-flight hit
  if (pendingMoveFetches.has(url)) return pendingMoveFetches.get(url)!;

  // 3. New fetch
  const fetchPromise = fetchMoveWithRetry(url, name)
    .then((data) => {
      moveCache.set(url, data);
      return data;
    })
    .finally(() => {
      pendingMoveFetches.delete(url);
    });

  pendingMoveFetches.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Fetches a batch of ids using Promise.allSettled so one failure
 * never kills the entire batch. Each id goes through fetchWithCache
 * independently — cache hits and in-flight deduplication apply per id.
 *
 * Returns one PokemonRawData per id in the same order.
 * Failed ids silently receive a fallback (already handled inside fetchWithRetry).
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
    // "rejected" should never happen because fetchWithRetry always returns fallback,
    // but if it does somehow, that id simply won't appear in the map.
    // The caller (batchGenerator) handles missing ids gracefully.
  }

  return map;
}

/**
 * Fetches full details for multiple moves in parallel.
 * Uses moveCache for efficiency.
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

/** Expose cache size for debugging / dev tools */
export function getCacheSize(): number {
  return pokemonCache.size + moveCache.size;
}

/** Clear cache — useful for testing */
export function clearCache(): void {
  pokemonCache.clear();
  moveCache.clear();
  pendingFetches.clear();
  pendingMoveFetches.clear();
}
