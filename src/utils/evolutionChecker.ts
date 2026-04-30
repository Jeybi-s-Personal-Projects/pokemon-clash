import { EVOLUTIONS, LevelUpCondition } from "../data/pokemon/evolutions/evolutions";
import { Pokemon } from "../types/pokemon";

/**
 * Checks if a Pokémon can evolve based on its new level.
 * Returns the target species ID if evolution is available and met, otherwise null.
 */
export function checkEvolution(pokemon: Pokemon, newLevel: number): number | null {
  const evolution = EVOLUTIONS.find(
    (e) =>
      e.fromId === pokemon.speciesId &&
      e.condition.trigger === "level-up" &&
      newLevel >= (e.condition as LevelUpCondition).level
  );

  return evolution ? evolution.toId : null;
}
