import { GEN1_GROWTH } from "../data/level/generation1/gen1GrowthMap";
import { GEN2_GROWTH } from "../data/level/generation2/gen2GrowthMap";
import { growthRates, GrowthRate } from "../data/level/growthRates";
import { Pokemon, Move } from "../types/pokemon";
import { SPECIES } from "../data/pokemon/species/species";
import { MOVES } from "../data/pokemon/moves/moves";
import { calculateHp, calculateStat } from "./statCalculator";

/**
 * Gets the growth rate for a given species ID.
 * Defaults to "medium-fast" if not found.
 */
export function getGrowthRate(speciesId: number): GrowthRate {
  return GEN1_GROWTH[speciesId] || GEN2_GROWTH[speciesId] || "medium-fast";
}

/**
 * Gets the total experience required for a specific level.
 */
export function getExpForLevel(level: number, growthRate: GrowthRate): number {
  if (level <= 1) return 0;
  if (level > 100) level = 100;
  return growthRates[growthRate](level);
}

/**
 * Calculates the experience gain from defeating a Pokémon.
 * Formula: Exp = (a * b * L) / 7
 * a = 1.5 if trainer battle, 1.0 if wild
 * b = base experience of defeated Pokémon
 * L = level of defeated Pokémon
 */
export function calculateExpGain(
  defeatedLevel: number,
  defeatedSpeciesId: number,
  isWild: boolean = true,
): number {
  const species = SPECIES[defeatedSpeciesId];
  if (!species) return 0;

  const a = isWild ? 1 : 1.5;
  const b = species.base_experience || 100;
  const L = defeatedLevel;

  return Math.floor((a * b * L) / 7);
}

export interface LevelUpResult {
  newLevel: number;
  totalExp: number;
  stats: {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  newMoves: Move[];
}

/**
 * Checks if a Pokémon levels up after gaining experience.
 * Returns null if no level up occurred, or LevelUpResult if it did.
 */
export function checkLevelUp(
  pokemon: Pokemon,
  expGained: number,
): LevelUpResult | null {
  const growthRate = pokemon.growthRate || getGrowthRate(pokemon.speciesId);
  let currentLevel = pokemon.level;
  const totalExp = pokemon.experience + expGained;

  let nextLevelExp = getExpForLevel(currentLevel + 1, growthRate);
  
  if (totalExp < nextLevelExp || currentLevel >= 100) {
    return null; // No level up
  }

  // Level up!
  while (totalExp >= nextLevelExp && currentLevel < 100) {
    currentLevel++;
    if (currentLevel < 100) {
      nextLevelExp = getExpForLevel(currentLevel + 1, growthRate);
    }
  }

  const species = SPECIES[pokemon.speciesId];
  if (!species) return null;

  const newMaxHp = calculateHp(species.baseStats.hp, currentLevel);
  // Simple heal on level up: give them the same amount of HP they gained in Max HP
  const hpGain = newMaxHp - pokemon.maxHp;
  const newHp = Math.min(pokemon.hp + hpGain, newMaxHp);

  // Check for new moves
  const learnedMoves: Move[] = [];
  species.rawMoves.forEach((rm) => {
    // If move is learned at a level between old level and new level
    if (rm.levelLearned > pokemon.level && rm.levelLearned <= currentLevel) {
      const moveDetail = MOVES[rm.name];
      if (moveDetail) {
        learnedMoves.push({
          name: rm.name,
          power: moveDetail.power ?? 0,
          pp: moveDetail.pp ?? 0,
          maxPp: moveDetail.pp ?? 0,
          type: moveDetail.type,
          damageClass: moveDetail.damageClass,
          accuracy: moveDetail.accuracy,
          statChanges: moveDetail.statChanges,
          description: moveDetail.description,
          priority: moveDetail.priority,
        });
      }
    }
  });

  return {
    newLevel: currentLevel,
    totalExp: totalExp,
    stats: {
      hp: newHp,
      maxHp: newMaxHp,
      attack: calculateStat(species.baseStats.attack, currentLevel),
      defense: calculateStat(species.baseStats.defense, currentLevel),
      specialAttack: calculateStat(species.baseStats.spAttack, currentLevel),
      specialDefense: calculateStat(species.baseStats.spDefense, currentLevel),
      speed: calculateStat(species.baseStats.speed, currentLevel),
    },
    newMoves: learnedMoves,
  };
}
