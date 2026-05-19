import { StatStages, WeatherCondition } from "../battle/battleTypes";
import { BattleMove, TrapState } from "../types/moveBattle";
import { Pokemon, StatusCondition } from "../types/pokemon";
import { getStatusDuration } from "./statusUtils";
import { getWeatherStartMessage } from "./weatherUtils";
import { getAbilityDisplayName, isImmuneToStatReduction, isImmuneToStatus } from "../battle/abilityHandler";

/**
 * Delays execution for a specified number of milliseconds.
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Formats a move description by replacing placeholders like $effect_chance.
 */
export const formatMoveDescription = (
  description: string | null | undefined,
  moveData: any,
): string => {
  if (!description) return "";

  // Extract effect chance from BattleMove structure or static MoveDetail structure
  const effectChance =
    moveData?.effects?.find((e: any) => e.chance > 0 && e.chance < 100)
      ?.chance ||
    moveData?.effects?.[0]?.chance ||
    moveData?.effectChance;

  return description.replace(/\$effect_chance/g, effectChance?.toString() || "");
};

/**
 * Checks if a move's prerequisites are met.
 */
export const checkMovePrerequisites = (
  move: BattleMove,
  attacker: Pokemon,
  target: Pokemon,
  weather: WeatherCondition,
): { success: boolean; reason?: string } => {
  if (!move.prerequisites || move.prerequisites.length === 0)
    return { success: true };

  for (const prereq of move.prerequisites) {
    switch (prereq.type) {
      case "held-item":
        if (attacker.heldItem !== prereq.value) {
          return {
            success: false,
            reason: `But ${attacker.name.toUpperCase()} isn't holding the required item!`,
          };
        }
        break;
      case "hp-above":
        if ((attacker.hp / attacker.maxHp) * 100 <= prereq.value) {
          return { success: false, reason: "But its HP is too low!" };
        }
        break;
      case "hp-below":
        if ((attacker.hp / attacker.maxHp) * 100 >= prereq.value) {
          return { success: false, reason: "But its HP is too high!" };
        }
        break;
      case "status":
        if (target.status !== prereq.value) {
          const statusName =
            prereq.value === "paralysis"
              ? "PARALYZED"
              : (prereq.value as string).toUpperCase();
          return {
            success: false,
            reason: `But ${target.name.toUpperCase()} isn't ${statusName}!`,
          };
        }
        break;
      case "weather":
        if (weather !== prereq.value) {
          return { success: false, reason: "But the weather isn't right!" };
        }
        break;
    }
  }

  return { success: true };
};

/**
 * Result of processing move effects.
 */
export type MoveEffectsResult = {
  // Stat stages
  playerStages?: StatStages;
  enemyStages?: StatStages;

  // Persistent status conditions
  playerStatus?: StatusCondition;
  playerStatusTurns?: number;
  enemyStatus?: StatusCondition;
  enemyStatusTurns?: number;

  // Volatile status (confusion)
  playerConfusionTurns?: number;
  enemyConfusionTurns?: number;

  // Flinch — clears at end of the turn
  playerFlinched?: boolean;
  enemyFlinched?: boolean;

  // Bad poison (Toxic) flag — escalating damage
  playerBadPoison?: boolean;
  enemyBadPoison?: boolean;

  // Weather
  weather?: WeatherCondition;
  weatherTurns?: number;

  // HP changes (positive = heal, negative = damage)
  playerHpChange?: number;
  enemyHpChange?: number;

  // Trapping effect
  playerTrap?: TrapState;
  enemyTrap?: TrapState;

  // User faints after executing this move (Explosion, Memento, etc.)
  selfFaint?: boolean;

  // Log messages to display
  logs: string[];
};

/**
 * Processes declarative move effects and returns the resulting state changes.
 * damageDealt is the raw damage from this hit (used for drain calculations).
 */
export const processMoveEffects = (
  move: BattleMove,
  attacker: Pokemon,
  target: Pokemon,
  playerStages: StatStages,
  enemyStages: StatStages,
  isPlayerAttacking: boolean,
  damageDealt: number = 0,
): MoveEffectsResult => {
  const result: MoveEffectsResult = { logs: [] };
  let currentPlayerStages = { ...playerStages };
  let currentEnemyStages = { ...enemyStages };

  move.effects.forEach((effect) => {
    // Roll for chance
    if (effect.chance < 100 && Math.random() * 100 > effect.chance) {
      return;
    }

    // Determine which side is the logical "target" of this effect
    const isTargetUser = effect.target === "user";
    const targetSide = isTargetUser
      ? isPlayerAttacking
        ? "player"
        : "enemy"
      : isPlayerAttacking
        ? "enemy"
        : "player";

    const targetPokemon =
      targetSide === "player"
        ? isPlayerAttacking
          ? attacker
          : target
        : isPlayerAttacking
          ? target
          : attacker;

    const targetName = targetPokemon.name.toUpperCase();

    switch (effect.type) {
      // ─────────────────────────────────────────────────────
      // STAT CHANGES
      // ─────────────────────────────────────────────────────
      case "stat-change": {
        const stagesToUpdate =
          targetSide === "player" ? currentPlayerStages : currentEnemyStages;

        const changes = Object.entries(effect.value).map(([stat, change]) => ({
          stat,
          change: change as number,
        }));

        const { newStages, logs } = applyStatChanges(
          stagesToUpdate,
          changes,
          targetPokemon,
          isTargetUser ? "self" : "opponent"
        );

        if (targetSide === "player") {
          currentPlayerStages = newStages;
          result.playerStages = newStages;
        } else {
          currentEnemyStages = newStages;
          result.enemyStages = newStages;
        }
        result.logs.push(...logs);
        break;
      }

      // ─────────────────────────────────────────────────────
      // STATUS CONDITIONS
      // ─────────────────────────────────────────────────────
      case "status": {
        const statusValue = effect.value as string;

        // ── Flinch ──
        if (statusValue === "flinch") {
          const ability = targetPokemon.ability?.toLowerCase();
          if (ability === "inner-focus") {
            // Inner Focus prevents flinching
            break;
          }
          if (targetSide === "player") result.playerFlinched = true;
          else result.enemyFlinched = true;
          break;
        }

        // ── Confusion ──
        if (statusValue === "confusion") {
          if (isImmuneToStatus(targetPokemon, "confusion")) {
            result.logs.push(`${targetName}'s ${getAbilityDisplayName(targetPokemon.ability!)} prevents confusion!`);
            break;
          }
          // Don't re-apply if already confused
          if (
            (targetSide === "player" && (target.confusionTurns ?? 0) > 0) ||
            (targetSide === "enemy" && (attacker.confusionTurns ?? 0) > 0)
          ) {
            break;
          }
          const confTurns = getStatusDuration("confusion");
          if (targetSide === "player") result.playerConfusionTurns = confTurns;
          else result.enemyConfusionTurns = confTurns;
          result.logs.push(`${targetName} became confused!`);
          break;
        }

        // ── Bad Poison (Toxic) ──
        if (statusValue === "bad-poison") {
          if (isImmuneToStatus(targetPokemon, "poison")) {
             result.logs.push(`${targetName}'s ${getAbilityDisplayName(targetPokemon.ability!)} prevents poisoning!`);
             break;
          }
          if (targetPokemon.status) {
            if (effect.chance === 100) {
              result.logs.push(
                `But it failed! ${targetName} already has a status condition.`,
              );
            }
            break;
          }
          // We store it as "poison" status internally but flag it as bad poison
          if (targetSide === "player") {
            result.playerStatus = "poison";
            result.playerStatusTurns = 16; // used as escalation counter
            result.playerBadPoison = true;
          } else {
            result.enemyStatus = "poison";
            result.enemyStatusTurns = 16;
            result.enemyBadPoison = true;
          }
          result.logs.push(`${targetName} was badly poisoned!`);
          break;
        }

        // ── All other standard statuses (burn, paralysis, sleep, freeze, poison) ──
        const status = statusValue as StatusCondition;
        if (!status) break;

        if (isImmuneToStatus(targetPokemon, status)) {
          result.logs.push(`${targetName}'s ${getAbilityDisplayName(targetPokemon.ability!)} prevents ${status}!`);
          break;
        }

        if (targetPokemon.status) {
          if (effect.chance === 100 && effect.target === "target") {
            result.logs.push(
              `But it failed! ${targetName} is already ${targetPokemon.status.toUpperCase()}.`,
            );
          }
          break;
        }

        if (targetSide === "player") {
          result.playerStatus = status;
          result.playerStatusTurns = getStatusDuration(status);
        } else {
          result.enemyStatus = status;
          result.enemyStatusTurns = getStatusDuration(status);
        }

        const statusMessages: Record<string, string> = {
          paralysis: `${targetName} is paralyzed! It may be unable to move!`,
          burn: `${targetName} was burned!`,
          freeze: `${targetName} was frozen solid!`,
          sleep: `${targetName} fell asleep!`,
          poison: `${targetName} was poisoned!`,
        };
        result.logs.push(
          statusMessages[status] ?? `${targetName} was afflicted!`,
        );
        break;
      }

      // ─────────────────────────────────────────────────────
      // WEATHER
      // ─────────────────────────────────────────────────────
      case "weather": {
        const weather = effect.value as WeatherCondition;
        result.weather = weather;
        result.weatherTurns = 5;
        result.logs.push(getWeatherStartMessage(weather));
        break;
      }

      // ─────────────────────────────────────────────────────
      // HEAL
      // ─────────────────────────────────────────────────────
      case "heal": {
        const healPercent = effect.value as number;
        const healAmount = Math.floor(
          targetPokemon.maxHp * (healPercent / 100),
        );
        const actualHeal = Math.min(
          healAmount,
          targetPokemon.maxHp - targetPokemon.hp,
        );

        if (targetSide === "player") {
          result.playerHpChange = (result.playerHpChange || 0) + actualHeal;
        } else {
          result.enemyHpChange = (result.enemyHpChange || 0) + actualHeal;
        }

        if (actualHeal > 0) {
          result.logs.push(`${targetName} restored its HP!`);
        }
        break;
      }

      // ─────────────────────────────────────────────────────
      // DRAIN (heal user based on damage dealt)
      // ─────────────────────────────────────────────────────
      case "drain": {
        const drainPercent = effect.value as number;
        const healAmount = Math.floor(damageDealt * (drainPercent / 100));

        // Drain always heals the attacker (user side)
        const attackerSide = isPlayerAttacking ? "player" : "enemy";
        const attackerPokemon = isPlayerAttacking ? attacker : target;
        const actualHeal = Math.min(
          healAmount,
          attackerPokemon.maxHp - attackerPokemon.hp,
        );

        if (attackerSide === "player") {
          result.playerHpChange = (result.playerHpChange || 0) + actualHeal;
        } else {
          result.enemyHpChange = (result.enemyHpChange || 0) + actualHeal;
        }

        if (actualHeal > 0) {
          result.logs.push(`${attacker.name.toUpperCase()} drained energy!`);
        }
        break;
      }

      // ─────────────────────────────────────────────────────
      // RECOIL (user takes damage based on % of maxHp)
      // ─────────────────────────────────────────────────────
      case "recoil": {
        const recoilPercent = effect.value as number;
        // Recoil is always taken by the attacker (user side)
        const attackerSide = isPlayerAttacking ? "player" : "enemy";
        const attackerPokemon = isPlayerAttacking ? attacker : target;
        const recoilDamage = Math.max(
          1,
          Math.floor(damageDealt * (recoilPercent / 100)),
        );

        if (attackerSide === "player") {
          result.playerHpChange = (result.playerHpChange || 0) - recoilDamage;
        } else {
          result.enemyHpChange = (result.enemyHpChange || 0) - recoilDamage;
        }

        result.logs.push(
          `${attackerPokemon.name.toUpperCase()} is damaged by recoil!`,
        );
        break;
      }

      // ─────────────────────────────────────────────────────
      // TRAP (Wrap, Bind, Fire Spin, Whirlpool, etc.)
      // ─────────────────────────────────────────────────────
      case "trap": {
        const trapValue = effect.value as {
          turns: [number, number] | number;
          damagePerTurn: number;
        };

        const duration = Array.isArray(trapValue.turns)
          ? Math.floor(
              Math.random() * (trapValue.turns[1] - trapValue.turns[0] + 1),
            ) + trapValue.turns[0]
          : (trapValue.turns as number);

        const trap: TrapState = {
          moveId: move.id,
          turnsLeft: duration,
          damagePerTurn: trapValue.damagePerTurn,
        };

        if (targetSide === "player") {
          result.playerTrap = trap;
        } else {
          result.enemyTrap = trap;
        }

        const trapMessages: Record<string, string> = {
          wrap: `${targetName} was squeezed by WRAP!`,
          bind: `${targetName} was squeezed by BIND!`,
          "fire-spin": `${targetName} was trapped in a FIRE SPIN!`,
          whirlpool: `${targetName} was trapped in a WHIRLPOOL!`,
          clamp: `${targetName} was clamped!`,
          "sand-tomb": `${targetName} was trapped in a SAND TOMB!`,
          infestation: `${targetName} was infested!`,
        };
        result.logs.push(trapMessages[move.id] ?? `${targetName} was trapped!`);
        break;
      }

      // ─────────────────────────────────────────────────────
      // HP COST (Belly Drum: pay HP to maximise a stat)
      // ─────────────────────────────────────────────────────
      case "hp-cost": {
        const costPercent = effect.value as number;
        const cost = Math.floor(targetPokemon.maxHp * (costPercent / 100));

        if (targetPokemon.hp <= cost) {
          result.logs.push("But it failed! Not enough HP!");
          break;
        }

        if (targetSide === "player") {
          result.playerHpChange = (result.playerHpChange || 0) - cost;
          // For Belly Drum, max out Attack
          if (move.id === "belly-drum") {
            result.playerStages = { ...currentPlayerStages, attack: 6 };
            result.logs.push(
              `${targetName} cut its own HP and maximized its ATTACK!`,
            );
          }
        } else {
          result.enemyHpChange = (result.enemyHpChange || 0) - cost;
          if (move.id === "belly-drum") {
            result.enemyStages = { ...currentEnemyStages, attack: 6 };
            result.logs.push(
              `${targetName} cut its own HP and maximized its ATTACK!`,
            );
          }
        }
        break;
      }

      // ─────────────────────────────────────────────────────
      // SELF FAINT (Explosion, Self-Destruct, Memento)
      // ─────────────────────────────────────────────────────
      case "self-faint": {
        result.selfFaint = true;
        break;
      }

      // ─────────────────────────────────────────────────────
      // CHARGE and MULTI-HIT are handled in executeMove directly
      // ─────────────────────────────────────────────────────
      case "charge":
      case "multi-hit":
      case "unique":
        break;
    }
  });

  return result;
};

/**
 * Applies stat changes to a set of stages and returns the new stages and a log of the changes.
 */
export const applyStatChanges = (
  currentStages: StatStages,
  changes: { stat: string; change: number }[],
  target: Pokemon,
  source: "self" | "opponent" = "opponent"
) => {
  const newStages = { ...currentStages };
  let logs: string[] = [];
  const targetName = target.name.toUpperCase();

  changes.forEach((c) => {
    const statKey = c.stat as keyof StatStages;
    if (newStages[statKey] !== undefined) {
      // Ability Check for reduction
      if (c.change < 0 && isImmuneToStatReduction(target, statKey, source)) {
        logs.push(`${targetName}'s ${getAbilityDisplayName(target.ability!)} prevents its ${c.stat.toUpperCase()} from falling!`);
        return;
      }

      const oldStage = newStages[statKey];
      newStages[statKey] = Math.max(-6, Math.min(6, oldStage + c.change));

      const currentStage = newStages[statKey];
      const stageSign = currentStage > 0 ? "+" : "";

      if (currentStage === oldStage) {
        const limitWord = c.change > 0 ? "higher" : "lower";
        logs.push(
          `${targetName}'s ${c.stat.toUpperCase()} won't go any ${limitWord}! (${stageSign}${currentStage})`,
        );
      } else {
        const degree = Math.abs(c.change) >= 2 ? "sharply " : "";
        const direction = c.change > 0 ? "rose" : "fell";
        logs.push(
          `${targetName}'s ${c.stat.toUpperCase()} ${degree}${direction}! (${stageSign}${currentStage})`,
        );
      }
    }
  });

  return { newStages, logs };
};
