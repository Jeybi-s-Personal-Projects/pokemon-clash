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
      return ability === "immunity" || ability === "leaf-guard"; // leaf-guard handled separately in context of sun
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
      return ability === "hyper-cutter" || ability === "defiant";
    case "defense":
      return ability === "big-pecks";
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
 * Returns a damage multiplier applied to incoming damage based on the
 * defender's ability, move type, and battle context.
 * Multiply the raw damage by the returned value before applying it.
 *
 * Covers: Flash Fire, Volt Absorb, Water Absorb, Dry Skin, Levitate,
 *         Thick Fat, Filter, Solid Rock, Lightning Rod, Sap Sipper,
 *         Wonder Guard, Marvel Scale, Multiscale, Overcoat, Magic Guard.
 */
export function getAbilityDamageModifier(
  defender: Pokemon,
  moveType: string,
  moveDamageCategory: "physical" | "special" | "status",
  isWeatherDamage: boolean,
  state: BattleState,
  defenderSide: "player" | "enemy",
): { multiplier: number; absorbed: boolean; messages: string[] } {
  const ability = defender.ability?.toLowerCase();
  const name = defender.name.toUpperCase();
  const messages: string[] = [];
  let multiplier = 1;
  let absorbed = false;

  if (!ability) return { multiplier, absorbed, messages };

  switch (ability) {
    // ── Immunity + heal on hit ─────────────────────────────────────────────
    case "volt-absorb":
      if (moveType === "electric") {
        const heal = Math.floor(defender.maxHp / 4);
        messages.push(`${name}'s Volt Absorb restored its HP!`);
        return { multiplier: 0, absorbed: true, messages };
      }
      break;

    case "water-absorb":
      if (moveType === "water") {
        messages.push(`${name}'s Water Absorb restored its HP!`);
        return { multiplier: 0, absorbed: true, messages };
      }
      break;

    case "dry-skin":
      if (moveType === "water") {
        messages.push(`${name}'s Dry Skin restored its HP!`);
        return { multiplier: 0, absorbed: true, messages };
      }
      if (moveType === "fire") {
        multiplier = 1.25;
      }
      break;

    case "flash-fire":
      if (moveType === "fire") {
        messages.push(`${name}'s Flash Fire raised its power!`);
        return { multiplier: 0, absorbed: true, messages };
      }
      break;

    case "lightning-rod":
      if (moveType === "electric") {
        messages.push(`${name}'s Lightning Rod absorbed the move!`);
        return { multiplier: 0, absorbed: true, messages };
      }
      break;

    case "sap-sipper":
      if (moveType === "grass") {
        messages.push(`${name}'s Sap Sipper absorbed the move!`);
        return { multiplier: 0, absorbed: true, messages };
      }
      break;

    // ── Damage reduction ──────────────────────────────────────────────────
    case "levitate":
      if (moveType === "ground") {
        messages.push(`${name}'s Levitate made it immune!`);
        return { multiplier: 0, absorbed: false, messages };
      }
      break;

    case "thick-fat":
      if (moveType === "fire" || moveType === "ice") {
        multiplier = 0.5;
      }
      break;

    case "filter":
    case "solid-rock":
      // Applied only when a super-effective move hits; caller must pass
      // isSuper = true via messages param extension if needed.
      // Handled externally in damage calculation where type effectiveness is known.
      break;

    case "multiscale":
      if (defender.hp === defender.maxHp) {
        multiplier = 0.5;
      }
      break;

    // ── Weather damage immunity ────────────────────────────────────────────
    case "overcoat":
    case "magic-guard":
      if (isWeatherDamage) {
        return { multiplier: 0, absorbed: false, messages };
      }
      if (ability === "magic-guard" && !isWeatherDamage) {
        // magic-guard also blocks poison/burn/leech damage; handled in
        // processStatusDamage via separate check.
      }
      break;

    // ── Contact damage reflection ──────────────────────────────────────────
    // (Rough Skin is handled in processContactAbility; this covers Iron Barbs,
    //  which has the same effect — add the case string if needed.)
  }

  return { multiplier, absorbed, messages };
}

/**
 * Returns true if Magic Guard prevents this Pokémon from taking
 * indirect (non-move) damage such as poison, burn, weather, recoil, or Leech Seed.
 */
export function isMagicGuardActive(pokemon: Pokemon): boolean {
  return pokemon.ability?.toLowerCase() === "magic-guard";
}

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
    // ── Stat changes ──────────────────────────────────────────────────────
    case "intimidate": {
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
    }

    // ── Weather setters ───────────────────────────────────────────────────
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

    // ── Ability copying ────────────────────────────────────────────────────
    case "trace": {
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

    // ── Informational announcements ────────────────────────────────────────
    case "pressure":
      messages.push(`${enteringName} is exerting its Pressure!`);
      break;

    case "anticipation": {
      // Check if opponent has a super-effective or OHKO move
      const dangerousMoves = (opponentPokemon.moves ?? []).filter((move) => {
        // A full type-effectiveness check would live in typeUtils;
        // here we just flag it as a hint if any move data is present.
        return move.power && move.power >= 100;
      });
      if (dangerousMoves.length > 0) {
        messages.push(`${enteringName}'s Anticipation made it shudder!`);
      }
      break;
    }

    case "forewarn": {
      // Reveal opponent's highest-power move
      const opponentMoves = opponentPokemon.moves ?? [];
      if (opponentMoves.length > 0) {
        const strongest = opponentMoves.reduce((best, move) =>
          (move.power ?? 0) > (best.power ?? 0) ? move : best,
        );
        messages.push(
          `${enteringName}'s Forewarn: ${opponentName} knows ${strongest.name?.toUpperCase() ?? "a powerful move"}!`,
        );
      }
      break;
    }

    case "frisk": {
      // Reveal opponent's held item (if tracked on Pokémon object)
      const item = (opponentPokemon as any).heldItem;
      if (item) {
        messages.push(
          `${enteringName} frisked ${opponentName} and found its ${item}!`,
        );
      } else {
        messages.push(
          `${enteringName} frisked ${opponentName} but found no item!`,
        );
      }
      break;
    }

    // ── Stat protection announcement ──────────────────────────────────────
    case "cloud-nine":
      messages.push(`${enteringName} eliminated the effects of weather!`);
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
    // ── Status-inflicting contact abilities ────────────────────────────────
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

    case "poison-touch":
      if (
        roll < 30 &&
        !attacker.status &&
        !isImmuneToStatus(attacker, "poison")
      ) {
        messages.push(`${defenderName}'s Poison Touch!`);
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

    // ── Damage on contact ──────────────────────────────────────────────────
    case "rough-skin": {
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

    // ── Stat changes on contact ────────────────────────────────────────────
    case "weak-armor":
      // Defender takes a physical hit: –1 Def, +1 Speed
      {
        const defStages =
          attackerSide === "player" ? state.enemyStages : state.playerStages;
        const { newStages: s1 } = applyStatChanges(
          defStages,
          [{ stat: "defense", change: -1 }],
          defender,
          "self",
        );
        const { newStages: s2, logs } = applyStatChanges(
          s1,
          [{ stat: "speed", change: 1 }],
          defender,
          "self",
        );
        if (attackerSide === "player") state.enemyStages = s2;
        else state.playerStages = s2;
        messages.push(`${defenderName}'s Weak Armor!`);
        messages.push(...logs);
      }
      break;

    // ── Cursed Body — 30% chance to Disable the move used ─────────────────
    case "cursed-body":
      if (roll < 30) {
        messages.push(
          `${defenderName}'s Cursed Body disabled the attacker's move!`,
        );
        // Mark the attacker's last used move as disabled; requires move tracking.
        // Store a flag on state for the battle engine to process:
        if (attackerSide === "player") {
          (state as any).playerMoveDisabled = true;
          (state as any).playerMoveDisabledTurns = 4;
        } else {
          (state as any).enemyMoveDisabled = true;
          (state as any).enemyMoveDisabledTurns = 4;
        }
      }
      break;

    // ── Synchronize — reflect burn/poison/paralysis back ──────────────────
    // (Primary direction handled in processStatusApplied below;
    //  this case is a no-op here since contact doesn't directly set status)
  }

  return { newState: state, messages };
}

/**
 * Call this whenever a status condition is successfully applied to a Pokémon.
 * Synchronize will mirror burn, paralysis, or poison back to the attacker.
 */
export async function processStatusApplied(
  targetSide: "player" | "enemy",
  status: StatusCondition,
  currentState: BattleState,
): Promise<AbilityEffectResult> {
  const state = { ...currentState };
  const messages: string[] = [];

  const target = targetSide === "player" ? state.player : state.enemy;
  const source = targetSide === "player" ? state.enemy : state.player;
  const sourceAbility = target.ability?.toLowerCase(); // Synchronize is on the TARGET
  const targetAbility = target.ability?.toLowerCase();

  const targetName = target.name.toUpperCase();
  const sourceName = source.name.toUpperCase();

  // Synchronize: when THIS pokemon gets a status, reflect it back
  if (targetAbility === "synchronize") {
    if (
      (status === "burn" || status === "paralysis" || status === "poison") &&
      !source.status &&
      !isImmuneToStatus(source, status)
    ) {
      messages.push(`${targetName}'s Synchronize!`);
      if (targetSide === "player") {
        state.enemy = {
          ...source,
          status,
          statusTurns: getStatusDuration(status),
        };
      } else {
        state.player = {
          ...source,
          status,
          statusTurns: getStatusDuration(status),
        };
      }
      messages.push(`${sourceName} was ${statusLabel(status)} by Synchronize!`);
    }
  }

  return { newState: state, messages };
}

function statusLabel(status: StatusCondition): string {
  switch (status) {
    case "burn":
      return "burned";
    case "paralysis":
      return "paralyzed";
    case "poison":
      return "poisoned";
    case "sleep":
      return "put to sleep";
    case "freeze":
      return "frozen";
    default:
      return "afflicted";
  }
}

/**
 * Call this when a Pokémon is knocked out.
 * Handles Moxie (Attack +1) and Aftermath (damage to attacker on contact KO).
 */
export async function processKnockOutAbilities(
  koSide: "player" | "enemy", // the side that was KO'd
  wasContactMove: boolean,
  currentState: BattleState,
): Promise<AbilityEffectResult> {
  const state = { ...currentState };
  const messages: string[] = [];

  const attacker = koSide === "player" ? state.enemy : state.player;
  const fainted = koSide === "player" ? state.player : state.enemy;
  const attackerSide = koSide === "player" ? "enemy" : "player";

  // Moxie — attacker's Attack rises on KO
  if (attacker.ability?.toLowerCase() === "moxie") {
    const selfStages =
      attackerSide === "player" ? state.playerStages : state.enemyStages;
    const { newStages, logs } = applyStatChanges(
      selfStages,
      [{ stat: "attack", change: 1 }],
      attacker,
      "self",
    );
    if (attackerSide === "player") state.playerStages = newStages;
    else state.enemyStages = newStages;
    messages.push(`${attacker.name.toUpperCase()}'s Moxie!`);
    messages.push(...logs);
  }

  // Aftermath — if KO'd Pokémon has Aftermath and was hit by a contact move
  if (fainted.ability?.toLowerCase() === "aftermath" && wasContactMove) {
    const damage = Math.max(1, Math.floor(attacker.maxHp / 4));
    const newHp = Math.max(0, attacker.hp - damage);
    messages.push(`${fainted.name.toUpperCase()}'s Aftermath!`);
    if (attackerSide === "player") {
      state.player = { ...attacker, hp: newHp };
    } else {
      state.enemy = { ...attacker, hp: newHp };
    }
    messages.push(
      `${attacker.name.toUpperCase()} was caught in the aftermath!`,
    );
  }

  return { newState: state, messages };
}

/**
 * Call this when a Pokémon switches OUT (not faints).
 * Handles Natural Cure, Regenerator.
 */
export async function processSwitchOutAbilities(
  switchingSide: "player" | "enemy",
  currentState: BattleState,
): Promise<AbilityEffectResult> {
  const state = { ...currentState };
  const messages: string[] = [];

  // Use the team member being recalled, not the active slot that gets overwritten
  const pokemon = switchingSide === "player" ? state.player : state.enemy;
  const ability = pokemon.ability?.toLowerCase();
  const name = pokemon.name.toUpperCase();

  if (!ability) return { newState: state, messages };

  // Natural Cure — clears status on switch-out
  if (ability === "natural-cure" && pokemon.status) {
    const healed = { ...pokemon, status: null, statusTurns: 0 };
    if (switchingSide === "player") {
      state.player = healed;
      state.team[state.activePlayerIndex] = healed;
    } else {
      state.enemy = healed;
    }
    messages.push(`${name}'s Natural Cure healed its status!`);
  }

  // Regenerator — restore 1/3 max HP on switch-out
  if (ability === "regenerator" && pokemon.hp > 0) {
    const heal = Math.floor(pokemon.maxHp / 3);
    const newHp = Math.min(pokemon.maxHp, pokemon.hp + heal);
    if (newHp > pokemon.hp) {
      const healed = { ...pokemon, hp: newHp };
      if (switchingSide === "player") {
        state.player = healed;
        state.team[state.activePlayerIndex] = healed;
      } else {
        state.enemy = healed;
      }
      messages.push(`${name}'s Regenerator restored some HP!`);
    }
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
    // ── Speed Boost ───────────────────────────────────────────────────────
    case "speed-boost": {
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
    }

    // ── Shed Skin ─────────────────────────────────────────────────────────
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

    // ── Weather healing ───────────────────────────────────────────────────
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

    // ── Dry Skin — rain heals, sun damages ────────────────────────────────
    case "dry-skin":
      if (state.weather === "rain") {
        const heal = Math.floor(pokemon.maxHp / 8);
        const nextHp = Math.min(pokemon.maxHp, pokemon.hp + heal);
        if (nextHp > pokemon.hp) {
          messages.push(`${name}'s Dry Skin absorbed the rain!`);
          if (side === "player") state.player = { ...pokemon, hp: nextHp };
          else state.enemy = { ...pokemon, hp: nextHp };
        }
      } else if (state.weather === "sun") {
        if (!isMagicGuardActive(pokemon)) {
          const damage = Math.max(1, Math.floor(pokemon.maxHp / 8));
          const nextHp = Math.max(0, pokemon.hp - damage);
          messages.push(
            `${name} is hurt by its Dry Skin in the harsh sunlight!`,
          );
          if (side === "player") state.player = { ...pokemon, hp: nextHp };
          else state.enemy = { ...pokemon, hp: nextHp };
        }
      }
      break;

    // ── Solar Power — sun boosts Sp.Atk but costs HP ─────────────────────
    case "solar-power":
      if (state.weather === "sun") {
        if (!isMagicGuardActive(pokemon)) {
          const damage = Math.max(1, Math.floor(pokemon.maxHp / 8));
          const nextHp = Math.max(0, pokemon.hp - damage);
          messages.push(`${name}'s Solar Power is draining its HP!`);
          if (side === "player") state.player = { ...pokemon, hp: nextHp };
          else state.enemy = { ...pokemon, hp: nextHp };
        }
      }
      break;

    // ── Hydration — clears status in rain ─────────────────────────────────
    case "hydration":
      if (state.weather === "rain" && pokemon.status) {
        messages.push(`${name}'s Hydration cured its status!`);
        const updated = { ...pokemon, status: null, statusTurns: 0 };
        if (side === "player") {
          state.player = updated;
          state.playerBadPoison = false;
        } else {
          state.enemy = updated;
          state.enemyBadPoison = false;
        }
      }
      break;

    // ── Leaf Guard — prevents status in sun (passive; also check on apply) ─
    case "leaf-guard":
      // Passive immunity to status in sun is checked at status-application time;
      // nothing to do each end of turn.
      break;

    // ── Moody — random +2 / -1 to different stats ─────────────────────────
    case "moody": {
      const allStats: Array<keyof StatStages> = [
        "attack",
        "defense",
        "specialAttack",
        "specialDefense",
        "speed",
        "accuracy",
        "evasion",
      ];
      const selfStages =
        side === "player" ? state.playerStages : state.enemyStages;

      // Pick a stat to raise (not already at +6)
      const canRaise = allStats.filter((s) => (selfStages[s] ?? 0) < 6);
      // Pick a stat to lower (not already at -6, and not the same as the raised stat)
      if (canRaise.length > 0) {
        const raiseIdx = Math.floor(Math.random() * canRaise.length);
        const raiseStat = canRaise[raiseIdx];
        const canLower = allStats.filter(
          (s) => s !== raiseStat && (selfStages[s] ?? 0) > -6,
        );
        const { newStages: s1, logs: logs1 } = applyStatChanges(
          selfStages,
          [{ stat: raiseStat, change: 2 }],
          pokemon,
          "self",
        );
        let finalStages = s1;
        if (canLower.length > 0) {
          const lowerStat =
            canLower[Math.floor(Math.random() * canLower.length)];
          const { newStages: s2, logs: logs2 } = applyStatChanges(
            s1,
            [{ stat: lowerStat, change: -1 }],
            pokemon,
            "self",
          );
          finalStages = s2;
          messages.push(`${name}'s Moody!`);
          messages.push(...logs1, ...logs2);
        } else {
          messages.push(`${name}'s Moody!`);
          messages.push(...logs1);
        }
        if (side === "player") state.playerStages = finalStages;
        else state.enemyStages = finalStages;
      }
      break;
    }

    // ── Pickup — collect opponent's last used item ─────────────────────────
    // (Tracked externally; no end-of-turn HP/status effect here)

    // ── Anger Point — if the Pokémon was crit'd this turn, max Attack ──────
    // (Triggered via processAngerPoint helper below when a crit is detected)
  }

  return { newState: state, messages };
}

/**
 * Call this immediately after a critical hit lands on a Pokémon with Anger Point.
 * Raises the Pokémon's Attack to the maximum (+6 stages).
 */
export async function processAngerPoint(
  hitSide: "player" | "enemy",
  currentState: BattleState,
): Promise<AbilityEffectResult> {
  const state = { ...currentState };
  const messages: string[] = [];

  const pokemon = hitSide === "player" ? state.player : state.enemy;
  if (pokemon.ability?.toLowerCase() !== "anger-point") {
    return { newState: state, messages };
  }

  const selfStages =
    hitSide === "player" ? state.playerStages : state.enemyStages;
  const currentAtk = selfStages.attack ?? 0;
  const boost = 6 - currentAtk;

  if (boost > 0) {
    const { newStages, logs } = applyStatChanges(
      selfStages,
      [{ stat: "attack", change: boost }],
      pokemon,
      "self",
    );
    if (hitSide === "player") state.playerStages = newStages;
    else state.enemyStages = newStages;
    messages.push(
      `${pokemon.name.toUpperCase()}'s Anger Point maxed its Attack!`,
    );
    messages.push(...logs);
  }

  return { newState: state, messages };
}

/**
 * Call this when a Pokémon's stat is lowered by an opponent.
 * Handles Defiant (+2 Atk), Competitive (+2 SpAtk), Contrary (invert),
 * Rattled (+1 Spd on Dark/Ghost/Bug hit), Justified (+1 Atk on Dark hit).
 */
export async function processStatLoweredAbilities(
  affectedSide: "player" | "enemy",
  stat: keyof StatStages,
  movetype: string | null, // type of the move that caused the drop, if any
  currentState: BattleState,
): Promise<AbilityEffectResult> {
  const state = { ...currentState };
  const messages: string[] = [];

  const pokemon = affectedSide === "player" ? state.player : state.enemy;
  const ability = pokemon.ability?.toLowerCase();
  const name = pokemon.name.toUpperCase();

  if (!ability) return { newState: state, messages };

  const selfStages =
    affectedSide === "player" ? state.playerStages : state.enemyStages;

  switch (ability) {
    case "defiant": {
      const { newStages, logs } = applyStatChanges(
        selfStages,
        [{ stat: "attack", change: 2 }],
        pokemon,
        "self",
      );
      if (affectedSide === "player") state.playerStages = newStages;
      else state.enemyStages = newStages;
      messages.push(`${name}'s Defiant!`);
      messages.push(...logs);
      break;
    }

    case "competitive": {
      const { newStages, logs } = applyStatChanges(
        selfStages,
        [{ stat: "specialAttack", change: 2 }],
        pokemon,
        "self",
      );
      if (affectedSide === "player") state.playerStages = newStages;
      else state.enemyStages = newStages;
      messages.push(`${name}'s Competitive!`);
      messages.push(...logs);
      break;
    }

    case "rattled":
      if (movetype && ["dark", "ghost", "bug"].includes(movetype)) {
        const { newStages, logs } = applyStatChanges(
          selfStages,
          [{ stat: "speed", change: 1 }],
          pokemon,
          "self",
        );
        if (affectedSide === "player") state.playerStages = newStages;
        else state.enemyStages = newStages;
        messages.push(`${name}'s Rattled!`);
        messages.push(...logs);
      }
      break;

    case "justified":
      if (movetype === "dark") {
        const { newStages, logs } = applyStatChanges(
          selfStages,
          [{ stat: "attack", change: 1 }],
          pokemon,
          "self",
        );
        if (affectedSide === "player") state.playerStages = newStages;
        else state.enemyStages = newStages;
        messages.push(`${name}'s Justified!`);
        messages.push(...logs);
      }
      break;
  }

  return { newState: state, messages };
}
