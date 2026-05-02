import { generateLevel, generateShiny } from "@/src/encounter/generators";
import { weightedPickMany } from "@/src/encounter/weightedPicker";
import { buildFallback, fetchBatch } from "./fetchWithCache";
import type { EncounterTable, GeneratedEncounter, QueueEntry } from "./types";

/**
 * Region/area → encounter table registry.
 * Extend this as you add more regions and tables.
 */
import {
  gen1Cave,
  gen1Forest,
  gen1Grass,
  gen1Water,
} from "@/src/encounter/gen1/tables";
import {
  gen2Cave,
  gen2Forest,
  gen2Grass,
  gen2Water,
} from "@/src/encounter/gen2/tables";

// Local Pokémon DB types for metadata injection
import { gen1Pokemon } from "@/src/data/gen1Pokemon";
import { gen2Pokemon } from "@/src/data/gen2Pokemon";

export type Region = "gen1" | "gen2";
export type Area =
  | "plains"
  | "mountain"
  | "water"
  | "cave"
  | "urban"
  | "volcano"
  | "training"
  | "safari";

const TABLE_REGISTRY: Record<Region, Record<Area, EncounterTable>> = {
  gen1: {
    plains: require("./gen1/tables").gen1Plains,
    mountain: require("./gen1/tables").gen1Mountain,
    water: require("./gen1/tables").gen1Water,
    cave: require("./gen1/tables").gen1Cave,
    urban: require("./gen1/tables").gen1Urban,
    volcano: require("./gen1/tables").gen1Volcano,
    training: require("./gen1/tables").gen1Training,
    safari: require("./gen1/tables").gen1Safari,
  },
  gen2: {
    plains: require("./gen2/tables").gen2Plains,
    mountain: require("./gen2/tables").gen2Mountain,
    water: require("./gen2/tables").gen2Water,
    cave: require("./gen2/tables").gen2Cave,
    urban: require("./gen2/tables").gen2Urban,
    volcano: require("./gen2/tables").gen2Volcano,
    training: require("./gen2/tables").gen2Training,
    safari: require("./gen2/tables").gen2Safari,
  },
};

const ALL_LOCAL = [...gen1Pokemon, ...gen2Pokemon];

/**
 * Resolves a table from the registry.
 * Throws early if the combination doesn't exist — better to fail loud here
 * than silently produce wrong encounters.
 */
export function getTable(region: Region, area: Area): EncounterTable {
  const table = TABLE_REGISTRY[region]?.[area];
  if (!table) {
    throw new Error(`No encounter table for region="${region}" area="${area}"`);
  }
  return table;
}

/**
 * Generates `count` encounters from a given region/area, then fetches
 * all required Pokémon data (deduplicated via fetchBatch).
 *
 * Returns ready-to-queue QueueEntry objects: each has the generated
 * encounter data AND the raw API data needed at dequeue time.
 *
 * Uses Promise.allSettled internally so partial API failures still
 * produce a full batch (missing data gets fallback stats/moves).
 */
export async function generateBatch(
  region: Region,
  area: Area,
  count: number = 10,
): Promise<QueueEntry[]> {
  const table = getTable(region, area);

  // Step 1: Generate encounters (pure JS, instant)
  const picks = weightedPickMany(table, count);
  const generated: GeneratedEncounter[] = picks.map((entry) => ({
    id: entry.id,
    level: generateLevel(entry),
    isShiny: generateShiny(entry),
  }));

  // Step 2: Prepare items for fetching with local metadata
  const uniqueIds = [...new Set(generated.map((g) => g.id))];
  const itemsToFetch = uniqueIds.map((id) => {
    const local = ALL_LOCAL.find((p) => p.id === id);
    return {
      id,
      name: local?.name,
      types: local?.types,
    };
  });

  // Step 3: Fetch all unique IDs in parallel (cache + promise registry handle deduplication)
  const dataMap = await fetchBatch(itemsToFetch);

  // Step 4: Assemble QueueEntry for each generated encounter
  return generated.map((enc) => {
    const rawData = dataMap.get(enc.id) ?? buildFallback();
    return {
      ...enc,
      rawData,
    };
  });
}
