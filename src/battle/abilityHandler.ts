import { Pokemon, StatusCondition } from "../types/pokemon";
import { applyStatChanges } from "../utils/battleUtils";
import { getStatusDuration } from "../utils/statusUtils";
import { BattleState, StatStages } from "./battleTypes";

/**
 * Checks if a Pokémon is immune to a status condition due to its ability.
 */
export function isImmuneToStatus(
  pokemon: Pokemon,
  status: StatusCondition | "confusion",
): boolean {
  const ability = pokemon.ability?.toLowerCase();

  switch (status) {
    case "paralysis":
      return ability === "limber";
    case "sleep":
      return ability === "insomnia" || ability === "vital-spirit";
    case "poison":
      return ability === "immunity";
    case "burn":
      return ability === "water-veil";
    case "freeze":
      return ability === "magma-armor";
    case "confusion":
      return ability === "own-tempo";
    default:
      return false;
  }
}

/**
 * Checks if a Pokémon is immune to a specific stat reduction due to its ability.
 */
export function isImmuneToStatReduction(
  pokemon: Pokemon,
  stat: keyof StatStages,
  source: "self" | "opponent",
): boolean {
  if (source === "self") return false;

  const ability = pokemon.ability?.toLowerCase();

  if (ability === "clear-body" || ability === "white-smoke") {
    return true;
  }

  switch (stat) {
    case "attack":
      return ability === "hyper-cutter";
    case "accuracy":
      return ability === "keen-eye";
    default:
      return false;
  }
}

/**
 * Get the name of the ability to display in messages.
 */
export function getAbilityDisplayName(abilityId: string): string {
  if (!abilityId) return "Unknown";
  return abilityId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Result of processing an ability effect.
 */
export type AbilityEffectResult = {
  newState: BattleState;
  messages: string[];
};

/**
 * Processes abilities that activate when a Pokémon enters the battle.
 */
export async function processSwitchInAbilities(
  enteringSide: "player" | "enemy",
  currentState: BattleState,
): Promise<AbilityEffectResult> {
  let state = { ...currentState };
  const messages: string[] = [];

  const enteringPokemon =
    enteringSide === "player" ? state.player : state.enemy;
  const opponentPokemon =
    enteringSide === "player" ? state.enemy : state.player;
  const ability = enteringPokemon.ability?.toLowerCase();

  if (!ability) return { newState: state, messages };

  const enteringName = enteringPokemon.name.toUpperCase();
  const opponentName = opponentPokemon.name.toUpperCase();

  switch (ability) {
    case "intimidate":
      messages.push(`${enteringName}'s Intimidate!`);
      const targetStages =
        enteringSide === "player" ? state.enemyStages : state.playerStages;
      const { newStages, logs } = applyStatChanges(
        targetStages,
        [{ stat: "attack", change: -1 }],
        opponentPokemon,
        "opponent",
      );
      if (enteringSide === "player") {
        state.enemyStages = newStages;
      } else {
        state.playerStages = newStages;
      }
      messages.push(...logs);
      break;

    case "drizzle":
      if (state.weather !== "rain") {
        state.weather = "rain";
        state.weatherTurns = 5; 
        messages.push(`${enteringName}'s Drizzle summoned rain!`);
      }
      break;

    case "drought":
      if (state.weather !== "sun") {
        state.weather = "sun";
        state.weatherTurns = 5;
        messages.push(`${enteringName}'s Drought intensified the sun's rays!`);
      }
      break;

    case "sand-stream":
      if (state.weather !== "sandstorm") {
        state.weather = "sandstorm";
        state.weatherTurns = 5;
        messages.push(`${enteringName}'s Sand Stream whipped up a sandstorm!`);
      }
      break;

    case "snow-warning":
      if (state.weather !== "hail") {
        state.weather = "hail";
        state.weatherTurns = 5;
        messages.push(`${enteringName}'s Snow Warning whipped up a hailstorm!`);
      }
      break;


    case "trace":
      const targetAbility = opponentPokemon.ability;
      if (targetAbility && targetAbility.toLowerCase() !== "trace") {
        messages.push(
          `${enteringName} traced ${opponentName}'s ${getAbilityDisplayName(targetAbility)}!`,
        );
        const updatedEntering = { ...enteringPokemon, ability: targetAbility };
        if (enteringSide === "player") {
          state.player = updatedEntering;
          state.team = [...state.team];
          state.team[state.activePlayerIndex] = updatedEntering;
        } else {
          state.enemy = updatedEntering;
        }
      }
      break;
  }

  return { newState: state, messages };
}

/**
 * Processes abilities that trigger when a Pokémon is hit by a contact move.
 */
export async function processContactAbility(
  attackerSide: "player" | "enemy",
  currentState: BattleState,
): Promise<AbilityEffectResult> {
  const state = { ...currentState };
  const messages: string[] = [];

  const attacker = attackerSide === "player" ? state.player : state.enemy;
  const defender = attackerSide === "player" ? state.enemy : state.player;
  const ability = defender.ability?.toLowerCase();

  if (!ability) return { newState: state, messages };

  const attackerName = attacker.name.toUpperCase();
  const defenderName = defender.name.toUpperCase();
  const roll = Math.random() * 100;

  switch (ability) {
    case "static":
      if (
        roll < 30 &&
        !attacker.status &&
        !isImmuneToStatus(attacker, "paralysis")
      ) {
        messages.push(`${defenderName}'s Static!`);
        const status = "paralysis";
        if (attackerSide === "player") {
          state.player = {
            ...attacker,
            status,
            statusTurns: getStatusDuration(status),
          };
        } else {
          state.enemy = {
            ...attacker,
            status,
            statusTurns: getStatusDuration(status),
          };
        }
        messages.push(
          `${attackerName} is paralyzed! It may be unable to move!`,
        );
      }
      break;

    case "poison-point":
      if (
        roll < 30 &&
        !attacker.status &&
        !isImmuneToStatus(attacker, "poison")
      ) {
        messages.push(`${defenderName}'s Poison Point!`);
        const status = "poison";
        if (attackerSide === "player") {
          state.player = {
            ...attacker,
            status,
            statusTurns: getStatusDuration(status),
          };
        } else {
          state.enemy = {
            ...attacker,
            status,
            statusTurns: getStatusDuration(status),
          };
        }
        messages.push(`${attackerName} was poisoned!`);
      }
      break;

    case "flame-body":
      if (
        roll < 30 &&
        !attacker.status &&
        !isImmuneToStatus(attacker, "burn")
      ) {
        messages.push(`${defenderName}'s Flame Body!`);
        const status = "burn";
        if (attackerSide === "player") {
          state.player = {
            ...attacker,
            status,
            statusTurns: getStatusDuration(status),
          };
        } else {
          state.enemy = {
            ...attacker,
            status,
            statusTurns: getStatusDuration(status),
          };
        }
        messages.push(`${attackerName} was burned!`);
      }
      break;

    case "effect-spore":
      if (roll < 30 && !attacker.status) {
        const sporeRoll = Math.random() * 3;
        let status: StatusCondition = null;
        let msg = "";

        if (sporeRoll < 1 && !isImmuneToStatus(attacker, "sleep")) {
          status = "sleep";
          msg = `${attackerName} fell asleep!`;
        } else if (sporeRoll < 2 && !isImmuneToStatus(attacker, "paralysis")) {
          status = "paralysis";
          msg = `${attackerName} is paralyzed!`;
        } else if (!isImmuneToStatus(attacker, "poison")) {
          status = "poison";
          msg = `${attackerName} was poisoned!`;
        }

        if (status) {
          messages.push(`${defenderName}'s Effect Spore!`);
          if (attackerSide === "player") {
            state.player = {
              ...attacker,
              status,
              statusTurns: getStatusDuration(status),
            };
          } else {
            state.enemy = {
              ...attacker,
              status,
              statusTurns: getStatusDuration(status),
            };
          }
          messages.push(msg);
        }
      }
      break;

    case "rough-skin":
      messages.push(`${defenderName}'s Rough Skin!`);
      const damage = Math.max(1, Math.floor(attacker.maxHp / 8));
      if (attackerSide === "player") {
        state.player = { ...attacker, hp: Math.max(0, attacker.hp - damage) };
      } else {
        state.enemy = { ...attacker, hp: Math.max(0, attacker.hp - damage) };
      }
      messages.push(`${attackerName} was hurt!`);
      break;
  }

  return { newState: state, messages };
}

/**
 * Processes abilities that activate at the end of a turn.
 */
export async function processEndTurnAbilities(
  side: "player" | "enemy",
  currentState: BattleState,
): Promise<AbilityEffectResult> {
  const state = { ...currentState };
  const messages: string[] = [];

  const pokemon = side === "player" ? state.player : state.enemy;
  const ability = pokemon.ability?.toLowerCase();

  if (!ability || pokemon.hp <= 0) return { newState: state, messages };

  const name = pokemon.name.toUpperCase();

  switch (ability) {
    case "speed-boost":
      const { newStages, logs } = applyStatChanges(
        side === "player" ? state.playerStages : state.enemyStages,
        [{ stat: "speed", change: 1 }],
        pokemon,
        "self",
      );
      if (side === "player") state.playerStages = newStages;
      else state.enemyStages = newStages;
      messages.push(`${name}'s Speed Boost!`);
      messages.push(...logs);
      break;

    case "shed-skin":
      if (pokemon.status && Math.random() * 100 < 33) {
        messages.push(`${name}'s Shed Skin!`);
        const updated = { ...pokemon, status: null, statusTurns: 0 };
        if (side === "player") {
          state.player = updated;
          state.playerBadPoison = false;
        } else {
          state.enemy = updated;
          state.enemyBadPoison = false;
        }
        messages.push(`${name} healed its status condition!`);
      }
      break;

    case "rain-dish":
      if (state.weather === "rain") {
        const heal = Math.floor(pokemon.maxHp / 16);
        const nextHp = Math.min(pokemon.maxHp, pokemon.hp + heal);
        if (nextHp > pokemon.hp) {
          messages.push(`${name}'s Rain Dish restored its HP!`);
          if (side === "player") state.player = { ...pokemon, hp: nextHp };
          else state.enemy = { ...pokemon, hp: nextHp };
        }
      }
      break;

    case "ice-body":
      if (state.weather === "hail") {
        const heal = Math.floor(pokemon.maxHp / 16);
        const nextHp = Math.min(pokemon.maxHp, pokemon.hp + heal);
        if (nextHp > pokemon.hp) {
          messages.push(`${name}'s Ice Body restored its HP!`);
          if (side === "player") state.player = { ...pokemon, hp: nextHp };
          else state.enemy = { ...pokemon, hp: nextHp };
        }
      }
      break;
  }

  return { newState: state, messages };
}
