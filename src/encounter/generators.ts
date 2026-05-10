import type { EncounterEntry } from "./types";

const DEFAULT_SHINY_RATE = 1 / 64;

/**
 * Generates a random level within the entry's min/max range (inclusive).
 */
export function generateLevel(entry: EncounterEntry): number {
  const { min, max } = entry.levels;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Rolls for shiny status. Uses entry-specific rate if defined, otherwise
 * falls back to the standard Gen 6+ rate of 1/4096.
 */
export function generateShiny(entry: EncounterEntry): boolean {
  const rate = entry.shinyRate ?? DEFAULT_SHINY_RATE;
  return Math.random() < rate;
}
