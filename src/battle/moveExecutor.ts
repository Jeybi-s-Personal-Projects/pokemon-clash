import { Move, Pokemon } from "../types/pokemon";
import { BattleState } from "./battleTypes";
import { BATTLE_MOVES } from "../data/pokemon/moves/movesBattle";
import {
  checkMovePrerequisites,
  delay,
  processMoveEffects,
} from "../utils/battleUtils";
import { dealDamage } from "./battleEngine";
import { getMoveId, CHARGE_MESSAGES } from "./battleConstants";
import { MOVE_STATUS_MAP, getStatusDuration } from "../utils/statusUtils";
import { MOVE_WEATHER_MAP, getWeatherStartMessage } from "../utils/weatherUtils";
import { applyStatChanges } from "../utils/battleUtils";
import { ChargeState } from "../types/moveBattle";

export type ExecutionContext = {
  setCurrentMessage: (msg: string | null) => void;
  setState: (fn: (prev: BattleState) => BattleState) => void;
};

export const executeMove = async (
  move: Move,
  attackerSide: "player" | "enemy",
  currentState: BattleState,
  context: ExecutionContext,
): Promise<BattleState> => {
  const { setCurrentMessage, setState } = context;
  const isPlayerAttacking = attackerSide === "player";
  const attacker = isPlayerAttacking
    ? currentState.player
    : currentState.enemy;
  const defender = isPlayerAttacking
    ? currentState.enemy
    : currentState.player;
  const attackerStages = isPlayerAttacking
    ? currentState.playerStages
    : currentState.enemyStages;
  const defenderStages = isPlayerAttacking
    ? currentState.enemyStages
    : currentState.playerStages;

  const prefix = isPlayerAttacking ? "" : "Wild ";
  setCurrentMessage(
    `${prefix}${attacker.name.toUpperCase()} used ${move.name.toUpperCase()}!`,
  );
  await delay(1500);

  // ── Look up the enhanced move data ──────────────────────
  const moveId = getMoveId(move);
  const enhancedMove = BATTLE_MOVES[moveId];

  // ── 1. Accuracy check ───────────────────────────────────
  const moveAccuracy = enhancedMove?.accuracy ?? move.accuracy;
  if (moveAccuracy != null) {
    const accStage = attackerStages.accuracy;
    const evaStage = defenderStages.evasion;

    const accMult =
      accStage >= 0 ? (3 + accStage) / 3 : 3 / (3 + Math.abs(accStage));
    const evaMult =
      evaStage >= 0 ? (3 + evaStage) / 3 : 3 / (3 + Math.abs(evaStage));

    const hitChance = moveAccuracy * (accMult / evaMult);

    if (Math.random() * 100 > hitChance) {
      setCurrentMessage(
        `${prefix}${attacker.name.toUpperCase()}'s attack missed!`,
      );
      await delay(1500);
      return currentState;
    }
  }

  // ── 1.5. Prerequisites check ────────────────────────────
  if (enhancedMove) {
    const prereqCheck = checkMovePrerequisites(
      enhancedMove,
      attacker,
      defender,
      currentState.weather,
    );
    if (!prereqCheck.success) {
      setCurrentMessage(prereqCheck.reason || "But it failed!");
      await delay(1500);
      return currentState;
    }
  }

  // ── 2. Charge-move handling ──────────────────────────────
  const chargeEffect = enhancedMove?.effects.find((e) => e.type === "charge");
  const attackerCharge = isPlayerAttacking
    ? currentState.playerCharge
    : currentState.enemyCharge;

  if (chargeEffect && !attackerCharge?.executeNextTurn) {
    const chargeMsg = CHARGE_MESSAGES[moveId] ?? "is charging power!";
    setCurrentMessage(`${prefix}${attacker.name.toUpperCase()} ${chargeMsg}`);
    await delay(1500);

    const newCharge: ChargeState = {
      moveId: moveId,
      executeNextTurn: true,
    };

    return {
      ...currentState,
      ...(isPlayerAttacking
        ? { playerCharge: newCharge }
        : { enemyCharge: newCharge }),
    };
  }

  if (attackerCharge?.executeNextTurn) {
    currentState = {
      ...currentState,
      ...(isPlayerAttacking
        ? { playerCharge: undefined }
        : { enemyCharge: undefined }),
    };
  }

  // ── Mutable working variables ────────────────────────────
  let nextPlayerStages = currentState.playerStages;
  let nextEnemyStages = currentState.enemyStages;
  let nextPlayerHp = currentState.player.hp;
  let nextEnemyHp = currentState.enemy.hp;
  let nextPlayerStatus = currentState.player.status;
  let nextEnemyStatus = currentState.enemy.status;
  let nextPlayerStatusTurns = currentState.player.statusTurns;
  let nextEnemyStatusTurns = currentState.enemy.statusTurns;
  let nextPlayerConfusionTurns = currentState.player.confusionTurns;
  let nextEnemyConfusionTurns = currentState.enemy.confusionTurns;
  let nextPlayerBadPoison = currentState.playerBadPoison ?? false;
  let nextEnemyBadPoison = currentState.enemyBadPoison ?? false;
  let nextPlayerTrap = currentState.playerTrap;
  let nextEnemyTrap = currentState.enemyTrap;
  let nextWeather = currentState.weather;
  let nextWeatherTurns = currentState.weatherTurns;
  let nextPlayerFlinched = currentState.playerFlinched ?? false;
  let nextEnemyFlinched = currentState.enemyFlinched ?? false;

  let totalDamageDealt = 0;
  let critHappened = false;
  let moveLogs: string[] = [];
  let selfFainted = false;

  // ── 3. Multi-hit count ───────────────────────────────────
  let hitCount = 1;
  const multiHitEffect = enhancedMove?.effects.find(
    (e) => e.type === "multi-hit",
  );
  if (multiHitEffect) {
    const val = multiHitEffect.value;
    if (Array.isArray(val)) {
      hitCount = Math.floor(Math.random() * (val[1] - val[0] + 1)) + val[0];
    } else {
      hitCount = val as number;
    }
  }

  // ── 4. Main hit loop ─────────────────────────────────────
  for (let i = 0; i < hitCount; i++) {
    if (nextPlayerHp <= 0 || nextEnemyHp <= 0) break;

    let currentHitDamage = 0;

    if (move.power === 0 || move.power === null) {
      setState((s) => ({ ...s, dancingSide: attackerSide }));
      await delay(600);
      setState((s) => ({ ...s, dancingSide: null }));
    } else {
      setState((s) => ({ ...s, attackingSide: attackerSide }));
      await delay(400);
      setState((s) => ({
        ...s,
        hitSide: isPlayerAttacking ? "enemy" : "player",
        attackingSide: null,
      }));

      const { damage, isCrit } = dealDamage(
        attacker,
        attackerStages,
        defender,
        defenderStages,
        move,
        currentState.weather,
      );

      if (isCrit) critHappened = true;
      currentHitDamage = damage;
      totalDamageDealt += damage;

      if (isPlayerAttacking) {
        nextEnemyHp = Math.max(0, nextEnemyHp - damage);
      } else {
        nextPlayerHp = Math.max(0, nextPlayerHp - damage);
      }

      if (hitCount > 1) {
        await delay(400);
      }
    }

    // ── 5. Process declarative effects ─────────────────────
    if (
      enhancedMove &&
      (currentHitDamage > 0 || move.power === null || move.power === 0)
    ) {
      const result = processMoveEffects(
        enhancedMove,
        attacker,
        defender,
        nextPlayerStages,
        nextEnemyStages,
        isPlayerAttacking,
        currentHitDamage,
      );

      if (result.playerStages) nextPlayerStages = result.playerStages;
      if (result.enemyStages) nextEnemyStages = result.enemyStages;

      if (result.playerStatus !== undefined) {
        nextPlayerStatus = result.playerStatus;
        nextPlayerStatusTurns = result.playerStatusTurns || 0;
      }
      if (result.enemyStatus !== undefined) {
        nextEnemyStatus = result.enemyStatus;
        nextEnemyStatusTurns = result.enemyStatusTurns || 0;
      }

      if (result.playerConfusionTurns !== undefined)
        nextPlayerConfusionTurns = result.playerConfusionTurns;
      if (result.enemyConfusionTurns !== undefined)
        nextEnemyConfusionTurns = result.enemyConfusionTurns;

      if (result.playerFlinched) nextPlayerFlinched = true;
      if (result.enemyFlinched) nextEnemyFlinched = true;

      if (result.playerBadPoison) nextPlayerBadPoison = true;
      if (result.enemyBadPoison) nextEnemyBadPoison = true;

      if (result.playerTrap) nextPlayerTrap = result.playerTrap;
      if (result.enemyTrap) nextEnemyTrap = result.enemyTrap;

      if (result.weather !== undefined) {
        nextWeather = result.weather;
        nextWeatherTurns = result.weatherTurns || 0;
      }

      if (result.playerHpChange) {
        const maxHp = currentState.player.maxHp;
        nextPlayerHp = Math.max(
          0,
          Math.min(maxHp, nextPlayerHp + result.playerHpChange),
        );
      }
      if (result.enemyHpChange) {
        const maxHp = currentState.enemy.maxHp;
        nextEnemyHp = Math.max(
          0,
          Math.min(maxHp, nextEnemyHp + result.enemyHpChange),
        );
      }

      if (result.selfFaint) {
        selfFainted = true;
        if (isPlayerAttacking) {
          nextPlayerHp = 0;
        } else {
          nextEnemyHp = 0;
        }
      }

      moveLogs.push(...result.logs);
    } else if (!enhancedMove) {
      if (i === 0) {
        const nextDefenderHp = isPlayerAttacking ? nextEnemyHp : nextPlayerHp;
        let fallbackDefenderStatus = isPlayerAttacking
          ? nextEnemyStatus
          : nextPlayerStatus;
        let fallbackDefenderStatusTurns = isPlayerAttacking
          ? nextEnemyStatusTurns
          : nextPlayerStatusTurns;
        let fallbackDefenderConfusionTurns = isPlayerAttacking
          ? nextEnemyConfusionTurns
          : nextPlayerConfusionTurns;

        const statusEffect = MOVE_STATUS_MAP[move.name.toLowerCase()];
        if (statusEffect && nextDefenderHp > 0) {
          const roll = Math.random() * 100;
          if (roll < statusEffect.chance) {
            if (statusEffect.isVolatile) {
              if (!fallbackDefenderConfusionTurns) {
                fallbackDefenderConfusionTurns =
                  getStatusDuration("confusion");
                setCurrentMessage(
                  `${defender.name.toUpperCase()} became confused!`,
                );
                await delay(1200);
              }
            } else if (!fallbackDefenderStatus) {
              fallbackDefenderStatus = statusEffect.status;
              fallbackDefenderStatusTurns = getStatusDuration(
                statusEffect.status,
              );
              let statusMsg = "";
              switch (fallbackDefenderStatus) {
                case "poison":
                  statusMsg = `${defender.name.toUpperCase()} was poisoned!`;
                  break;
                case "burn":
                  statusMsg = `${defender.name.toUpperCase()} was burned!`;
                  break;
                case "paralysis":
                  statusMsg = `${defender.name.toUpperCase()} is paralyzed!`;
                  break;
                case "sleep":
                  statusMsg = `${defender.name.toUpperCase()} fell asleep!`;
                  break;
                case "freeze":
                  statusMsg = `${defender.name.toUpperCase()} was frozen solid!`;
                  break;
              }
              setCurrentMessage(statusMsg);
              await delay(1200);
            }
          }
        }

        const weatherEffect = MOVE_WEATHER_MAP[move.name.toLowerCase()];
        if (weatherEffect) {
          nextWeather = weatherEffect.weather;
          nextWeatherTurns = weatherEffect.duration;
          setCurrentMessage(getWeatherStartMessage(nextWeather));
          await delay(1200);
        }

        if (move.statChanges && move.statChanges.length > 0) {
          const isDebuff = move.statChanges[0].change < 0;
          const targetSide = isDebuff
            ? isPlayerAttacking
              ? "enemy"
              : "player"
            : attackerSide;
          const targetName =
            targetSide === "player"
              ? currentState.player.name
              : currentState.enemy.name;
          const targetStages =
            targetSide === "player" ? nextPlayerStages : nextEnemyStages;
          const { newStages, logs } = applyStatChanges(
            targetStages,
            move.statChanges,
            targetName,
          );
          if (targetSide === "player") nextPlayerStages = newStages;
          else nextEnemyStages = newStages;
          moveLogs.push(...logs);
        }

        if (isPlayerAttacking) {
          nextEnemyStatus = fallbackDefenderStatus;
          nextEnemyStatusTurns = fallbackDefenderStatusTurns;
          nextEnemyConfusionTurns = fallbackDefenderConfusionTurns;
        } else {
          nextPlayerStatus = fallbackDefenderStatus;
          nextPlayerStatusTurns = fallbackDefenderStatusTurns;
          nextPlayerConfusionTurns = fallbackDefenderConfusionTurns;
        }
      }
    }
  }

  if (critHappened) {
    setCurrentMessage("A critical hit!");
    await delay(1200);
  }

  if (hitCount > 1) {
    setCurrentMessage(`Hit ${hitCount} time${hitCount > 1 ? "s" : ""}!`);
    await delay(1200);
  }

  if (selfFainted) {
    setCurrentMessage(
      `${attacker.name.toUpperCase()} fainted after using ${move.name.toUpperCase()}!`,
    );
    await delay(1200);
  }

  for (const log of moveLogs) {
    setCurrentMessage(log);
    await delay(1200);
  }

  const nextPlayer: Pokemon = {
    ...currentState.player,
    hp: nextPlayerHp,
    status: nextPlayerStatus,
    statusTurns: nextPlayerStatusTurns,
    confusionTurns: nextPlayerConfusionTurns,
  };
  const nextEnemy: Pokemon = {
    ...currentState.enemy,
    hp: nextEnemyHp,
    status: nextEnemyStatus,
    statusTurns: nextEnemyStatusTurns,
    confusionTurns: nextEnemyConfusionTurns,
  };

  const nextTeam = [...currentState.team];
  nextTeam[currentState.activePlayerIndex] = nextPlayer;

  return {
    ...currentState,
    player: nextPlayer,
    enemy: nextEnemy,
    team: nextTeam,
    playerStages: nextPlayerStages,
    enemyStages: nextEnemyStages,
    weather: nextWeather,
    weatherTurns: nextWeatherTurns,
    playerTrap: nextPlayerTrap,
    enemyTrap: nextEnemyTrap,
    playerFlinched: nextPlayerFlinched,
    enemyFlinched: nextEnemyFlinched,
    playerBadPoison: nextPlayerBadPoison,
    enemyBadPoison: nextEnemyBadPoison,
    hitSide: null,
    attackingSide: null,
    dancingSide: null,
  };
};
