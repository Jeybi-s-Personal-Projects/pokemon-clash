/**
 * fetchWithCache.ts
 *
 * Cleaned up — static move data & species data only.
 * SQLite and network fetching removed as per project cleanup.
 */

import { MOVES } from "@/src/data/pokemon/moves/moves";
import { SPECIES } from "@/src/data/pokemon/species/species";
import type {
  MoveDetail,
  PokemonRawData,
} from "@/src/encounter/types";

// ─── L1 — in-memory cache for dynamic data if any ───────────────────────────

const pokemonCache = new Map<number, PokemonRawData>();
const moveCache = new Map<string, MoveDetail>();

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
    maxPp: 35,
    type: "normal",
    damageClass: "physical",
    effectChance: null,
    statChanges: [],
    description: "",
    priority: 0,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches PokemonRawData for a given id.
 * Sources: 
 *   1. Static SPECIES data
 *   2. In-memory cache
 *   3. Fallback
 */
export async function fetchWithCache(
  id: number,
): Promise<PokemonRawData> {
  // Check static data
  if (SPECIES[id]) {
    return SPECIES[id];
  }

  // Check in-memory
  if (pokemonCache.has(id)) {
    return pokemonCache.get(id)!;
  }

  return buildFallback();
}

/**
 * Fetches a MoveDetail for a given move name.
 */
export async function fetchMoveWithCache(
  _url: string,
  name: string,
): Promise<MoveDetail> {
  // Check static moves
  if (MOVES[name]) {
    return MOVES[name];
  }

  // Check in-memory
  if (moveCache.has(name)) {
    return moveCache.get(name)!;
  }

  return buildMoveFallback(name);
}

/**
 * Fetches a batch of ids.
 */
export async function fetchBatch(
  items: { id: number }[],
): Promise<Map<number, PokemonRawData>> {
  const map = new Map<number, PokemonRawData>();
  for (const item of items) {
    const data = await fetchWithCache(item.id);
    map.set(item.id, data);
  }
  return map;
}

/**
 * Fetches full details for multiple moves in parallel.
 */
export async function fetchMoveBatch(
  moves: { name: string; url: string }[],
): Promise<MoveDetail[]> {
  return moves.map(m => {
    if (MOVES[m.name]) {
      const move = MOVES[m.name];
      return { ...move, maxPp: (move.maxPp ?? move.pp) ?? 0 };
    }
    return buildMoveFallback(m.name);
  });
}

export function getCacheSize(): number {
  return pokemonCache.size + moveCache.size;
}

export function clearCache(): void {
  pokemonCache.clear();
  moveCache.clear();
}
