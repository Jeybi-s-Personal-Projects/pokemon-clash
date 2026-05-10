import { Move, Pokemon } from "../types/pokemon";
import { BattleState, StatStages, WeatherCondition } from "./battleTypes";
import { getTypeMultiplier, PokemonType } from "./typeChart";

/**
 * Gets the multiplier for a stat stage (-6 to +6).
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
  weather: WeatherCondition = null,
): { damage: number; isCrit: boolean } {
  if (move.power === 0) return { damage: 0, isCrit: false };

  const moveType = (move.type || "normal") as PokemonType;
  const ability = attacker.ability?.toLowerCase();
  const defAbility = defender.ability?.toLowerCase();

  // ── Levitate Check ──
  if (moveType === "ground" && defAbility === "levitate") {
    return { damage: 0, isCrit: false };
  }

  let typeMultiplier = getTypeMultiplier(moveType, defender.type as PokemonType[]);

  // STAB: Same Type Attack Bonus (1.5x)
  const stab = attacker.type.includes(moveType) ? 1.5 : 1;

  // Weather Multipliers
  let weatherMultiplier = 1;
  const isWeatherSuppressed = ability === "cloud-nine" || ability === "air-lock" || defAbility === "cloud-nine" || defAbility === "air-lock";

  if (!isWeatherSuppressed) {
    if (weather === "rain") {
      if (moveType === "water") weatherMultiplier = 1.5;
      else if (moveType === "fire") weatherMultiplier = 0.5;
    } else if (weather === "sun") {
      if (moveType === "fire") weatherMultiplier = 1.5;
      else if (moveType === "water") weatherMultiplier = 0.5;
    }
  }

  // Critical Hit (6.25% chance)
  const isCrit = Math.random() < 0.0625;
  const critMultiplier = isCrit ? 1.5 : 1;

  // Random variance (85-100%)
  const variance = Math.random() * (1 - 0.85) + 0.85;

  // ── Ability Modifiers (Offensive) ──
  let attackMultiplier = 1;
  if (move.damageClass !== "special") {
    if (ability === "huge-power" || ability === "pure-power") attackMultiplier *= 2;
    if (ability === "guts" && attacker.status) attackMultiplier *= 1.5;
    if (ability === "hustle") attackMultiplier *= 1.5;
  } else {
    // Sp.Atk modifiers could go here (e.g. Solar Power)
  }

  // Pinch Abilities (Blaze, Torrent, Overgrow)
  const isPinch = attacker.hp <= attacker.maxHp / 3;
  if (isPinch) {
    if (ability === "blaze" && moveType === "fire") attackMultiplier *= 1.5;
    if (ability === "torrent" && moveType === "water") attackMultiplier *= 1.5;
    if (ability === "overgrow" && moveType === "grass") attackMultiplier *= 1.5;
    if (ability === "swarm" && moveType === "bug") attackMultiplier *= 1.5;
  }

  // ── Ability Modifiers (Defensive) ──
  let defenseMultiplier = 1;
  if (move.damageClass !== "special") {
    if (defAbility === "marvel-scale" && defender.status) defenseMultiplier *= 1.5;
  }
  
  if (defAbility === "thick-fat" && (moveType === "fire" || moveType === "ice")) {
    attackMultiplier *= 0.5;
  }

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

  let effectiveAttack = calculateStatWithStages(attackStat, attackStage) * attackMultiplier;
  let effectiveDefense = calculateStatWithStages(defenseStat, defenseStage) * defenseMultiplier;

  // Burn penalty: Attack reduced by 50% (physical moves only)
  // Guts ignores burn penalty
  if (attacker.status === "burn" && move.damageClass !== "special" && ability !== "guts") {
    effectiveAttack = Math.floor(effectiveAttack * 0.5);
  }

  // Advanced damage formula
  const baseDamage =
    ((((2 * attacker.level) / 5 + 2) * move.power * (effectiveAttack / effectiveDefense)) / 50 + 2) *
    stab *
    typeMultiplier *
    critMultiplier *
    variance *
    weatherMultiplier;

  const finalDamage = Math.floor(baseDamage);

  return { damage: Math.max(finalDamage, 0), isCrit };
}

export function determineTurnOrder(
  player: Pokemon,
  playerStages: StatStages,
  playerMove: Move,
  enemy: Pokemon,
  enemyStages: StatStages,
  enemyMove: Move,
  weather: WeatherCondition = null,
): "player" | "enemy" {
  const pPriority = playerMove.priority || 0;
  const ePriority = enemyMove.priority || 0;

  if (pPriority > ePriority) return "player";
  if (ePriority > pPriority) return "enemy";

  // Priorities are equal, check speed
  let pSpeed = calculateStatWithStages(player.speed, playerStages.speed);
  let eSpeed = calculateStatWithStages(enemy.speed, enemyStages.speed);

  // Speed boosting abilities
  const isWeatherSuppressed = player.ability?.toLowerCase() === "cloud-nine" || player.ability?.toLowerCase() === "air-lock" || 
                              enemy.ability?.toLowerCase() === "cloud-nine" || enemy.ability?.toLowerCase() === "air-lock";

  if (!isWeatherSuppressed) {
    if (weather === "rain" && player.ability?.toLowerCase() === "swift-swim") pSpeed *= 2;
    if (weather === "rain" && enemy.ability?.toLowerCase() === "swift-swim") eSpeed *= 2;
    if (weather === "sun" && player.ability?.toLowerCase() === "chlorophyll") pSpeed *= 2;
    if (weather === "sun" && enemy.ability?.toLowerCase() === "chlorophyll") eSpeed *= 2;
  }

  if (player.status === "paralysis") pSpeed = Math.floor(pSpeed * 0.5);
  if (enemy.status === "paralysis") eSpeed = Math.floor(eSpeed * 0.5);

  if (pSpeed > eSpeed) return "player";
  if (eSpeed > pSpeed) return "enemy";

  // Speed tie, random flip
  return Math.random() < 0.5 ? "player" : "enemy";
}

export function isGameOver(state: BattleState) {
  if (state.enemy.hp <= 0) return "player";
  
  // Check if all team members have fainted
  const allFainted = state.team.every(p => p.hp <= 0);
  if (allFainted) return "enemy";
  
  return null;
}
