import { Move, Pokemon } from "../types/pokemon";
import { BattleState, StatStages } from "./battleTypes";
import { getTypeMultiplier, PokemonType } from "./typeChart";

/**
 * Gets the multiplier for a stat stage (-6 to +6).
 * Standard Pokemon formula: 
 * Positive: (2 + stage) / 2
 * Negative: 2 / (2 + abs(stage))
 */
export function getStatMultiplier(stage: number): number {
  if (stage >= 0) {
    return (2 + stage) / 2;
  } else {
    return 2 / (2 + Math.abs(stage));
  }
}

export function calculateStatWithStages(baseStat: number, stage: number): number {
  return Math.floor(baseStat * getStatMultiplier(stage));
}

export function dealDamage(
  attacker: Pokemon,
  attackerStages: StatStages,
  defender: Pokemon,
  defenderStages: StatStages,
  move: Move,
): number {
  if (move.power === 0) return 0;

  const moveType = (move.type || "normal") as PokemonType;
  const typeMultiplier = getTypeMultiplier(moveType, defender.type as PokemonType[]);

  // Determine which stats to use based on damage class
  let attackStat = attacker.attack;
  let attackStage = attackerStages.attack;
  let defenseStat = defender.defense;
  let defenseStage = defenderStages.defense;

  if (move.damageClass === "special") {
    attackStat = attacker.specialAttack;
    attackStage = attackerStages.specialAttack;
    defenseStat = defender.specialDefense;
    defenseStage = defenderStages.specialDefense;
  }

  const effectiveAttack = calculateStatWithStages(attackStat, attackStage);
  const effectiveDefense = calculateStatWithStages(defenseStat, defenseStage);

  // Simple damage formula: ((2*Level/5 + 2) * Power * A/D) / 50 + 2
  // We'll use a slightly simplified version but keeping the ratios
  const baseDamage = ((((2 * attacker.level) / 5 + 2) * move.power * (effectiveAttack / effectiveDefense)) / 50) + 2;

  const finalDamage = Math.floor(baseDamage * typeMultiplier);

  return Math.max(finalDamage, 0);
}

export function isGameOver(state: BattleState) {
  if (state.enemy.hp <= 0) return "player";
  if (state.player.hp <= 0) return "enemy";
  return null;
}
