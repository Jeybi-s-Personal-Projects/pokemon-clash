import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { fetchPokemon } from "../api/pokeApi";
import { getAIMove } from "../battle/ai";
import {
  dealDamage,
  determineTurnOrder,
  isGameOver,
} from "../battle/battleEngine";
import { BattleState, StatStages } from "../battle/battleTypes";
import { useAuth } from "../context/AuthContext";
import { BATTLE_MOVES } from "../data/pokemon/moves/movesBattle";
import { savePokemon, swapIntoTeam } from "../hooks/savePokemon";
import { supabase } from "../lib/supabase";
import { ChargeState, TrapState } from "../types/moveBattle";
import { Move, Pokemon } from "../types/pokemon";
import {
  applyStatChanges,
  checkMovePrerequisites,
  delay,
  processMoveEffects,
} from "../utils/battleUtils";
import { checkEvolution } from "../utils/evolutionChecker";
import { calculateExpGain, checkLevelUp } from "../utils/experienceCalculator";
import { calculateHp, calculateStat } from "../utils/statCalculator";
import { MOVE_STATUS_MAP, getStatusDuration } from "../utils/statusUtils";
import {
  MOVE_WEATHER_MAP,
  getWeatherContinueMessage,
  getWeatherStartMessage,
} from "../utils/weatherUtils";

import { MEGA_STATS } from "../data/pokemon/stats/megaStats";
import { applyMegaEvolution } from "../utils/megaEvolutionUtils";

const initialStages: StatStages = {
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
};

interface UseBattleOptions {
  player: Pokemon;
  team: Pokemon[];
  enemy: Pokemon;
  onBattleEnd?: (
    winner: "player" | "enemy",
    finalTeam: Pokemon[],
    didEvolve: boolean,
    activeIndex: number,
  ) => void;
  onCheckpoint?: (finalTeam: Pokemon[]) => void;
  onSave?: () => void;
  catchPending?: { item: { id: string; name: string; catchRate: number } };
  onToggleAutoBattle?: (v: boolean) => void;
}

// ─── Charge-turn flavour messages ──────────────────────────────────────────
const CHARGE_MESSAGES: Record<string, string> = {
  bounce: "sprang up high!",
  fly: "flew up high!",
  dig: "dug underground!",
  dive: "hid underwater!",
  "skull-bash": "tucked in its head!",
  "solar-beam": "took in sunlight!",
  "sky-attack": "is glowing!",
  "razor-wind": "whipped up a whirlwind!",
  "freeze-shock": "became cloaked in ice!",
  "ice-burn": "became cloaked in fire!",
};

// ─── Helper: convert a move's display name to the kebab-case lookup key ────
const getMoveId = (move: Move): string => {
  // Prefer the id field if it exists on the move object
  if ((move as any).id) return (move as any).id as string;
  return move.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

export function useBattle({
  player,
  team,
  enemy,
  onBattleEnd,
  onCheckpoint,
  onSave,
  catchPending,
  onToggleAutoBattle,
}: UseBattleOptions) {
  const { user } = useAuth();
  const [state, setState] = useState<BattleState>({
    player,
    team,
    activePlayerIndex: team.findIndex((p) => p.id === player.id) || 0,
    enemy,
    turn: "player",
    log: [],
    winner: null,
    attackingSide: null,
    dancingSide: null,
    hitSide: null,
    playerStages: { ...initialStages },
    enemyStages: { ...initialStages },
    weather: null,
    weatherTurns: 0,
    // New fields for charge, trap, flinch, bad
    chargingMove: null,
    playerCharge: undefined,
    enemyCharge: undefined,
    playerTrap: undefined,
    enemyTrap: undefined,
    playerFlinched: false,
    enemyFlinched: false,
    playerBadPoison: false,
    enemyBadPoison: false,
  });

  const [canMegaEvolve, setCanMegaEvolve] = useState(false);
  const [isMega, setIsMega] = useState(false);
  const [isMegaEvolving, setIsMegaEvolving] = useState(false);
  const [basePlayer, setBasePlayer] = useState<Pokemon | null>(null);

  // Check for mega evolution on switch or initialization
  useEffect(() => {
    if (!isMega && state.player.heldItem && MEGA_STATS[state.player.heldItem]) {
      setCanMegaEvolve(true);
    } else {
      setCanMegaEvolve(false);
    }
  }, [state.player.id, state.player.heldItem, isMega]);

  const handleMegaEvolution = async () => {
    if (!canMegaEvolve) return;

    setIsMegaEvolving(true);
    setBasePlayer(state.player);

    const evolvedPokemon = await applyMegaEvolution(state.player);

    const nextTeam = [...state.team];
    nextTeam[state.activePlayerIndex] = evolvedPokemon;

    setState((prev) => ({
      ...prev,
      player: evolvedPokemon,
      team: nextTeam,
    }));

    setIsMega(true);
    setCanMegaEvolve(false);
    setCurrentMessage(`${evolvedPokemon.name.toUpperCase()} has Mega Evolved!`);

    await delay(5000);

    setCurrentMessage(null);
    setIsMegaEvolving(false);
  };

  const revertMegaInTeam = (teamToRevert: Pokemon[]): Pokemon[] => {
    if (!isMega || !basePlayer) return teamToRevert;

    return teamToRevert.map((p) => {
      if (p.id === basePlayer.id && p.name.includes("Mega ")) {
        return { ...basePlayer, hp: p.hp, maxHp: basePlayer.maxHp };
      }
      return p;
    });
  };

  const resetMegaState = () => {
    setIsMega(false);
    setBasePlayer(null);
  };

  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [isPlayerEntering, setIsPlayerEntering] = useState(false);

  // Status Modal & Swap State
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [pendingCaughtId, setPendingCaughtId] = useState<string | null>(null);
  const [finalCatchResult, setFinalCatchResult] = useState<any>(null);

  // Switch Modal State
  const [switchModalVisible, setSwitchModalVisible] = useState(false);

  // Move Learning State
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [pendingMove, setPendingMove] = useState<Move | null>(null);
  const [learningPokemon, setLearningPokemon] = useState<Pokemon | null>(null);
  const [resolveMoveLearning, setResolveMoveLearning] = useState<{
    resolve: (updatedMoves: Move[]) => void;
  } | null>(null);

  // Evolution State
  const [evolutionVisible, setEvolutionVisible] = useState(false);
  const [evolvingPokemon, setEvolvingPokemon] = useState<{
    oldName: string;
    newSpeciesId: number;
    newName: string;
    spriteUrl: string;
  } | null>(null);
  const [resolveEvolution, setResolveEvolution] = useState<{
    resolve: () => void;
  } | null>(null);

  const promptMoveReplacement = (
    newMove: Move,
    pokemon: Pokemon,
  ): Promise<Move[]> => {
    return new Promise((resolve) => {
      setLearningPokemon(pokemon);
      setPendingMove(newMove);
      setMoveModalVisible(true);
      setResolveMoveLearning({ resolve });
    });
  };

  const handleMoveSelection = async (index: number | "skip") => {
    if (!resolveMoveLearning || !pendingMove || !learningPokemon) return;

    let updatedMoves = [...learningPokemon.moves];

    if (index !== "skip") {
      const oldMove = updatedMoves[index];
      updatedMoves[index] = { ...pendingMove };

      if (user && learningPokemon.id) {
        await supabase
          .from("pokemon_moves")
          .delete()
          .eq("pokemon_id", learningPokemon.id)
          .eq("move_name", oldMove.name);

        await supabase.from("pokemon_moves").insert({
          pokemon_id: learningPokemon.id,
          move_name: pendingMove.name,
          move_power: pendingMove.power,
          move_pp: pendingMove.pp,
          move_type: pendingMove.type ?? "normal",
          move_damageClass: pendingMove.damageClass,
          move_accuracy: pendingMove.accuracy,
          move_statChanges: JSON.stringify(pendingMove.statChanges),
          move_description: pendingMove.description,
          move_priority: pendingMove.priority,
        });
      }

      setCurrentMessage(
        `${learningPokemon.name.toUpperCase()} forgot ${oldMove.name.toUpperCase()} and learned ${pendingMove.name.toUpperCase()}!`,
      );
    } else {
      setCurrentMessage(
        `${learningPokemon.name.toUpperCase()} did not learn ${pendingMove.name.toUpperCase()}.`,
      );
    }

    setMoveModalVisible(false);
    await delay(1500);
    resolveMoveLearning.resolve(updatedMoves);
    setPendingMove(null);
    setLearningPokemon(null);
    setResolveMoveLearning(null);

    if (onToggleAutoBattle) onToggleAutoBattle(false);
  };

  // ── Handle Catch Sequence ──
  useEffect(() => {
    if (!catchPending || !user) return;

    const handleCatchSequence = async () => {
      setCurrentMessage(
        `PLAYER USED ${catchPending.item.name.toUpperCase()}...`,
      );
      await delay(2500);

      try {
        const { data, teamFull } = await savePokemon(state.enemy, user.id);
        const result = {
          caught: true,
          caughtPokemon: { ...state.enemy, id: data.id },
          teamFull,
        };
        setFinalCatchResult(result);
        setPendingCaughtId(data.id);

        setCurrentMessage(
          `GOTCHA! ${state.enemy.name.toUpperCase()} was caught!`,
        );
        await delay(1500);

        if (teamFull) {
          setStatusMessage(
            `Gotcha! ${state.enemy.name.toUpperCase()} was caught!\n\nYour team is full, so it was sent to the PC.`,
          );
        } else {
          setStatusMessage(
            `Gotcha! ${state.enemy.name.toUpperCase()} was caught!`,
          );
        }
        setStatusVisible(true);
      } catch (e) {
        console.error("Catch Error:", e);
        setCurrentMessage(`OH NO! The Pokémon broke free!`);
        await delay(1500);
        setCurrentMessage(null);
      }
    };

    handleCatchSequence();
  }, [catchPending, user]);

  const loadTeamForSwap = async (caughtId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("pokemon")
        .select("id, pk_name, pk_level")
        .eq("user_id", user.id)
        .not("pk_order", "is", null)
        .neq("pk_order", 0)
        .order("pk_order", { ascending: true });

      if (error) throw error;

      const members = data.map((p: any) => ({
        id: p.id,
        name: p.pk_name,
        level: p.pk_level,
      }));

      setTeamMembers(members);
      setPendingCaughtId(caughtId);
      setSwapModalVisible(true);
    } catch (e) {
      console.error("Failed to load team for swap", e);
    }
  };

  const handleStatusClose = () => {
    setStatusVisible(false);
    if (finalCatchResult?.teamFull) {
      loadTeamForSwap(pendingCaughtId!);
    } else {
      if (onSave) onSave();
      if (onBattleEnd)
        onBattleEnd("player", state.team, false, state.activePlayerIndex);
    }
  };

  const handleSwap = async (replacedId: string) => {
    try {
      await swapIntoTeam(pendingCaughtId!, replacedId);
      setSwapModalVisible(false);
      if (onSave) onSave();
      if (onBattleEnd)
        onBattleEnd("player", state.team, false, state.activePlayerIndex);
    } catch (e) {
      Alert.alert("Error", "Swap failed.");
    }
  };

  const handleDismissSwap = () => {
    setSwapModalVisible(false);
    if (onSave) onSave();
    if (onBattleEnd)
      onBattleEnd("player", state.team, false, state.activePlayerIndex);
  };

  const handleSwitch = async (index: number) => {
    if (index === state.activePlayerIndex) return;
    if (state.team[index].hp <= 0) {
      Alert.alert(
        "Cannot Switch",
        `${state.team[index].name} has no energy left to battle!`,
      );
      return;
    }

    setSwitchModalVisible(false);
    const isForced = state.player.hp <= 0;

    if (isForced && isMega && basePlayer) {
      const revertedTeam = state.team.map((p, i) =>
        i === state.activePlayerIndex
          ? { ...basePlayer, hp: 0, maxHp: basePlayer.maxHp }
          : p,
      );
      setState((s) => ({ ...s, team: revertedTeam }));
      setIsMega(false);
      setBasePlayer(null);
    }

    setCurrentMessage(`Go! ${state.team[index].name.toUpperCase()}!`);

    await delay(1200);

    const newState: BattleState = {
      ...state,
      player: state.team[index],
      activePlayerIndex: index,
      playerStages: { ...initialStages },
      // Clear player-side volatile state on switch
      playerCharge: undefined,
      playerTrap: undefined,
      playerFlinched: false,
      playerBadPoison: false,
    };

    setState(newState);
    setIsPlayerEntering(true);

    await delay(600);
    setIsPlayerEntering(false);

    if (!isForced) {
      const enemyMove = getAIMove(state.enemy, state.player);
      const afterEnemyState = await executeMove(enemyMove, "enemy", newState);
      setState(afterEnemyState);

      const winner = isGameOver(afterEnemyState);
      if (winner) {
        handleWinner(winner, afterEnemyState);
      } else if (afterEnemyState.player.hp <= 0) {
        setCurrentMessage(
          `${afterEnemyState.player.name.toUpperCase()} fainted!`,
        );
        await delay(1200);
        setSwitchModalVisible(true);
      } else {
        setCurrentMessage(null);
      }
    } else {
      setCurrentMessage(null);
    }
  };

  const processTurnPenalty = async () => {
    if (state.winner || currentMessage) return;
    setCurrentMessage(null);
    await delay(300);
    const enemyMove = getAIMove(state.enemy, state.player);
    const afterEnemyState = await executeMove(enemyMove, "enemy", state);
    setState(afterEnemyState);

    const winner = isGameOver(afterEnemyState);
    if (winner) {
      handleWinner(winner, afterEnemyState);
    } else if (afterEnemyState.player.hp <= 0) {
      setCurrentMessage(
        `${afterEnemyState.player.name.toUpperCase()} fainted!`,
      );
      await delay(1200);
      setSwitchModalVisible(true);
    } else {
      setCurrentMessage(null);
    }
  };

  const handleWinner = async (
    winner: "player" | "enemy",
    currentState: BattleState,
  ) => {
    setState({ ...currentState, winner });

    if (winner === "player") {
      await delay(1200);
      setCurrentMessage(
        `The wild ${currentState.enemy.name.toUpperCase()} fainted!`,
      );

      const baseExpGain = calculateExpGain(
        currentState.enemy.level,
        currentState.enemy.speciesId,
        true,
      );

      const finalTeam = [...currentState.team];
      let hasMilestone = false;
      const newMovesToSave: any[] = [];

      for (let i = 0; i < finalTeam.length; i++) {
        const p = finalTeam[i];
        if (p.hp <= 0) continue;

        const isActive = i === currentState.activePlayerIndex;
        const sharedExp = isActive
          ? baseExpGain
          : Math.floor(baseExpGain * 0.5);

        if (sharedExp <= 0) continue;

        const levelUp = checkLevelUp(p, sharedExp);
        let updatedPokemon = { ...p };

        if (levelUp) {
          hasMilestone = true;
          updatedPokemon = {
            ...p,
            level: levelUp.newLevel,
            experience: levelUp.totalExp,
            ...levelUp.stats,
          };

          await delay(1200);
          setCurrentMessage(`${p.name.toUpperCase()} gained ${sharedExp} EXP!`);
          await delay(1200);
          setCurrentMessage(
            `${p.name.toUpperCase()} grew to Level ${levelUp.newLevel}!`,
          );

          if (levelUp.newMoves.length > 0) {
            for (const move of levelUp.newMoves) {
              if (updatedPokemon.moves.length < 4) {
                updatedPokemon.moves = [...updatedPokemon.moves, move];
                await delay(1200);
                setCurrentMessage(
                  `${updatedPokemon.name.toUpperCase()} learned ${move.name.toUpperCase()}!`,
                );

                newMovesToSave.push({
                  pokemon_id: updatedPokemon.id,
                  move_name: move.name,
                  move_power: move.power,
                  move_pp: move.pp,
                  move_type: move.type ?? "normal",
                  move_damageClass: move.damageClass,
                  move_accuracy: move.accuracy,
                  move_statChanges: JSON.stringify(move.statChanges),
                  move_description: move.description,
                  move_priority: move.priority,
                });
              } else {
                await delay(1200);
                setCurrentMessage(
                  `${updatedPokemon.name.toUpperCase()} wants to learn ${move.name.toUpperCase()}...`,
                );
                await delay(1500);
                setCurrentMessage(`But it already knows 4 moves!`);
                await delay(1500);

                const newMoveset = await promptMoveReplacement(
                  move,
                  updatedPokemon,
                );
                updatedPokemon.moves = newMoveset;
              }
            }
          }

          const evolutionTargetId = checkEvolution(
            updatedPokemon,
            updatedPokemon.level,
          );
          if (evolutionTargetId) {
            setCurrentMessage(
              `What? ${updatedPokemon.name.toUpperCase()} is evolving!`,
            );
            await delay(2000);

            const newSpeciesData = await fetchPokemon(
              evolutionTargetId.toString(),
            );

            const evolve = new Promise<void>((resolve) => {
              setEvolvingPokemon({
                oldName: updatedPokemon.name,
                newSpeciesId: evolutionTargetId,
                newName: newSpeciesData.name,
                spriteUrl: newSpeciesData.sprites.other.showdown.front_default,
              });
              setEvolutionVisible(true);
              setResolveEvolution({ resolve });
            });

            await evolve;

            updatedPokemon = {
              ...updatedPokemon,
              speciesId: evolutionTargetId,
              name: newSpeciesData.name,
              type: newSpeciesData.types.map((t: any) => t.type.name),
              frontImage: newSpeciesData.sprites.other.showdown.front_default,
              backImage: newSpeciesData.sprites.other.showdown.back_default,
              hp: calculateHp(
                newSpeciesData.stats.find((s: any) => s.stat.name === "hp")
                  .base_stat,
                updatedPokemon.level,
              ),
              maxHp: calculateHp(
                newSpeciesData.stats.find((s: any) => s.stat.name === "hp")
                  .base_stat,
                updatedPokemon.level,
              ),
              attack: calculateStat(
                newSpeciesData.stats.find((s: any) => s.stat.name === "attack")
                  .base_stat,
                updatedPokemon.level,
              ),
              defense: calculateStat(
                newSpeciesData.stats.find((s: any) => s.stat.name === "defense")
                  .base_stat,
                updatedPokemon.level,
              ),
              specialAttack: calculateStat(
                newSpeciesData.stats.find(
                  (s: any) => s.stat.name === "special-attack",
                ).base_stat,
                updatedPokemon.level,
              ),
              specialDefense: calculateStat(
                newSpeciesData.stats.find(
                  (s: any) => s.stat.name === "special-defense",
                ).base_stat,
                updatedPokemon.level,
              ),
              speed: calculateStat(
                newSpeciesData.stats.find((s: any) => s.stat.name === "speed")
                  .base_stat,
                updatedPokemon.level,
              ),
            };

            setCurrentMessage(
              `${updatedPokemon.name.toUpperCase()} evolved into ${newSpeciesData.name.toUpperCase()}!`,
            );
            await delay(2000);
            if (onToggleAutoBattle) onToggleAutoBattle(false);
          }
        } else {
          updatedPokemon.experience += sharedExp;
          if (isActive) {
            await delay(1200);
            setCurrentMessage(
              `${p.name.toUpperCase()} gained ${sharedExp} EXP!`,
            );
          }
        }

        finalTeam[i] = updatedPokemon;

        setState((s) => ({
          ...s,
          player: i === s.activePlayerIndex ? updatedPokemon : s.player,
          team: finalTeam,
        }));
      }

      if (newMovesToSave.length > 0) {
        const uniqueMoves = Array.from(
          new Map(
            newMovesToSave.map((m) => [`${m.pokemon_id}-${m.move_name}`, m]),
          ).values(),
        );
        const { error } = await supabase
          .from("pokemon_moves")
          .insert(uniqueMoves);
        if (error) console.error("Error batch saving moves:", error);
      }

      if (hasMilestone && onCheckpoint) {
        await onCheckpoint(finalTeam);
      }

      await delay(1500);

      const teamForEnd = revertMegaInTeam(finalTeam);
      resetMegaState();

      if (onBattleEnd)
        onBattleEnd(
          "player",
          teamForEnd,
          hasMilestone,
          currentState.activePlayerIndex,
        );
    } else {
      setCurrentMessage(`${currentState.player.name.toUpperCase()} fainted!`);
      setState((s) => ({ ...s, hitSide: "player" }));
      await delay(2000);

      const teamForEnd = revertMegaInTeam(currentState.team);
      resetMegaState();

      if (onBattleEnd)
        onBattleEnd("enemy", teamForEnd, false, currentState.activePlayerIndex);
    }
  };

  // ════════════════════════════════════════════════════════════
  // executeMove — core move resolution
  // ════════════════════════════════════════════════════════════
  const executeMove = async (
    move: Move,
    attackerSide: "player" | "enemy",
    currentState: BattleState,
  ): Promise<BattleState> => {
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

    // ── 1. Prerequisites check ───────────────────────────────
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
    // If this is a charge move AND we haven't charged yet, do Turn 1 (announce + return early)
    const chargeEffect = enhancedMove?.effects.find((e) => e.type === "charge");
    const attackerCharge = isPlayerAttacking
      ? currentState.playerCharge
      : currentState.enemyCharge;

    if (chargeEffect && !attackerCharge?.executeNextTurn) {
      // Turn 1: show charge message and lock in the charge state
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

    // Turn 2 of a charge move: clear the charge state before attacking
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
        // [min, max]
        hitCount = Math.floor(Math.random() * (val[1] - val[0] + 1)) + val[0];
      } else {
        // Fixed number of hits
        hitCount = val as number;
      }
    }

    // ── 4. Main hit loop ─────────────────────────────────────
    for (let i = 0; i < hitCount; i++) {
      if (nextPlayerHp <= 0 || nextEnemyHp <= 0) break;

      let currentHitDamage = 0;

      if (move.power === 0 || move.power === null) {
        // Status / non-damaging move animation
        setState((s) => ({ ...s, dancingSide: attackerSide }));
        await delay(600);
        setState((s) => ({ ...s, dancingSide: null }));
      } else {
        // Damaging move animation
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

        // HP changes (heal / drain / recoil) — clamp to valid range
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
        // ── Legacy fallback for moves not in BATTLE_MOVES ──
        // Only run on first hit
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
    } // end hit loop

    // ── 6. Post-loop messages ────────────────────────────────
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

    // ── 7. Display effect logs ────────────────────────────────
    for (const log of moveLogs) {
      setCurrentMessage(log);
      await delay(1200);
    }

    // ── 8. Build updated Pokémon objects ─────────────────────
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

  // ════════════════════════════════════════════════════════════
  // attack — called when the player picks a move
  // ════════════════════════════════════════════════════════════
  const attack = async (playerMoveIndex: number) => {
    if (
      state.attackingSide ||
      state.dancingSide ||
      state.winner ||
      currentMessage
    )
      return;

    const playerMove = state.player.moves[playerMoveIndex];
    if (playerMove.pp <= 0) {
      setCurrentMessage("No PP left for this move!");
      await delay(1000);
      setCurrentMessage(null);
      return;
    }

    const enemyMove = getAIMove(state.enemy, state.player);

    const firstSide = determineTurnOrder(
      state.player,
      state.playerStages,
      playerMove,
      state.enemy,
      state.enemyStages,
      enemyMove,
    );
    const secondSide = firstSide === "player" ? "enemy" : "player";

    const turns = [
      {
        side: firstSide,
        move: firstSide === "player" ? playerMove : enemyMove,
      },
      {
        side: secondSide,
        move: secondSide === "player" ? playerMove : enemyMove,
      },
    ];

    let currentState = { ...state };

    // Clear flinch at the very start of a new turn
    currentState = {
      ...currentState,
      playerFlinched: false,
      enemyFlinched: false,
    };

    for (const turn of turns) {
      if (currentState.player.hp <= 0 || currentState.enemy.hp <= 0) break;

      const activeAttacker =
        turn.side === "player" ? currentState.player : currentState.enemy;

      let skipTurn = false;

      // ── Sleep check ────────────────────────────────────────
      if (activeAttacker.status === "sleep") {
        if (activeAttacker.statusTurns && activeAttacker.statusTurns > 0) {
          setCurrentMessage(
            `${activeAttacker.name.toUpperCase()} is fast asleep!`,
          );
          await delay(1200);

          const updatedAttacker = {
            ...activeAttacker,
            statusTurns: activeAttacker.statusTurns - 1,
          };
          currentState =
            turn.side === "player"
              ? { ...currentState, player: updatedAttacker }
              : { ...currentState, enemy: updatedAttacker };
          skipTurn = true;
        } else {
          setCurrentMessage(`${activeAttacker.name.toUpperCase()} woke up!`);
          await delay(1200);
          const updatedAttacker = {
            ...activeAttacker,
            status: null,
            statusTurns: 0,
          };
          currentState =
            turn.side === "player"
              ? { ...currentState, player: updatedAttacker }
              : { ...currentState, enemy: updatedAttacker };
        }
      }

      // ── Freeze check ───────────────────────────────────────
      if (!skipTurn && activeAttacker.status === "freeze") {
        if (Math.random() < 0.2) {
          setCurrentMessage(`${activeAttacker.name.toUpperCase()} thawed out!`);
          await delay(1200);
          const updatedAttacker = { ...activeAttacker, status: null };
          currentState =
            turn.side === "player"
              ? { ...currentState, player: updatedAttacker }
              : { ...currentState, enemy: updatedAttacker };
        } else {
          setCurrentMessage(
            `${activeAttacker.name.toUpperCase()} is frozen solid!`,
          );
          await delay(1200);
          skipTurn = true;
        }
      }

      // ── Paralysis check ────────────────────────────────────
      if (!skipTurn && activeAttacker.status === "paralysis") {
        if (Math.random() < 0.25) {
          setCurrentMessage(
            `${activeAttacker.name.toUpperCase()} is paralyzed! It can't move!`,
          );
          await delay(1200);
          skipTurn = true;
        }
      }

      // ── Flinch check (only the SECOND attacker can be flinched) ──
      if (!skipTurn && turn.side === secondSide) {
        const wasFlinched =
          turn.side === "player"
            ? currentState.playerFlinched
            : currentState.enemyFlinched;

        if (wasFlinched) {
          setCurrentMessage(
            `${activeAttacker.name.toUpperCase()} flinched and couldn't move!`,
          );
          await delay(1200);
          // Clear flinch immediately
          currentState =
            turn.side === "player"
              ? { ...currentState, playerFlinched: false }
              : { ...currentState, enemyFlinched: false };
          skipTurn = true;
        }
      }

      // ── Confusion check ────────────────────────────────────
      if (
        !skipTurn &&
        activeAttacker.confusionTurns &&
        activeAttacker.confusionTurns > 0
      ) {
        setCurrentMessage(`${activeAttacker.name.toUpperCase()} is confused!`);
        await delay(1200);

        const updatedAttacker = {
          ...activeAttacker,
          confusionTurns: activeAttacker.confusionTurns - 1,
        };
        currentState =
          turn.side === "player"
            ? { ...currentState, player: updatedAttacker }
            : { ...currentState, enemy: updatedAttacker };

        if (updatedAttacker.confusionTurns === 0) {
          setCurrentMessage(
            `${activeAttacker.name.toUpperCase()} snapped out of its confusion!`,
          );
          await delay(1200);
        } else if (Math.random() < 0.5) {
          setCurrentMessage(`It hurt itself in its confusion!`);
          await delay(600);

          const confDamage = Math.floor(
            (((2 * activeAttacker.level) / 5 + 2) *
              40 *
              (activeAttacker.attack / activeAttacker.defense)) /
              50 +
              2,
          );
          const damagedAttacker = {
            ...updatedAttacker,
            hp: Math.max(0, updatedAttacker.hp - confDamage),
          };

          currentState =
            turn.side === "player"
              ? {
                  ...currentState,
                  player: damagedAttacker,
                  hitSide: "player",
                }
              : {
                  ...currentState,
                  enemy: damagedAttacker,
                  hitSide: "enemy",
                };

          setState(currentState);
          await delay(600);
          setState((s) => ({ ...s, hitSide: null }));
          skipTurn = true;
        }
      }

      if (skipTurn) {
        setState(currentState);
        const winner = isGameOver(currentState);
        if (winner) {
          handleWinner(winner, currentState);
          return;
        }
        continue;
      }

      // ── Decrement PP for player ────────────────────────────
      if (turn.side === "player") {
        const updatedMoves = [...currentState.player.moves];
        const moveIdx = currentState.player.moves.findIndex(
          (m) => m.name === turn.move.name,
        );
        if (moveIdx !== -1) {
          updatedMoves[moveIdx] = { ...turn.move, pp: turn.move.pp - 1 };
          currentState = {
            ...currentState,
            player: { ...currentState.player, moves: updatedMoves },
          };
        }
      }

      currentState = await executeMove(
        turn.move,
        turn.side as "player" | "enemy",
        currentState,
      );
      setState(currentState);

      const winner = isGameOver(currentState);
      if (winner) {
        handleWinner(winner, currentState);
        return;
      }

      await delay(1000);
    }

    // ════════════════════════════════════════════════════════
    // END-OF-TURN EFFECTS
    // ════════════════════════════════════════════════════════
    let finalState = { ...currentState };

    // ── Weather tick ──────────────────────────────────────
    if (finalState.weather) {
      setCurrentMessage(getWeatherContinueMessage(finalState.weather));
      await delay(1200);

      finalState = { ...finalState, weatherTurns: finalState.weatherTurns - 1 };
      if (finalState.weatherTurns <= 0) {
        setCurrentMessage("The weather returned to normal.");
        await delay(1200);
        finalState = { ...finalState, weather: null, weatherTurns: 0 };
      }

      // Weather chip damage (Sandstorm / Hail)
      if (finalState.weather === "sandstorm" || finalState.weather === "hail") {
        for (const side of ["player", "enemy"] as const) {
          const p = side === "player" ? finalState.player : finalState.enemy;
          if (p.hp <= 0) continue;

          let isImmune = false;
          if (finalState.weather === "sandstorm") {
            isImmune = p.type.some((t) =>
              ["rock", "ground", "steel"].includes(t),
            );
          } else if (finalState.weather === "hail") {
            isImmune = p.type.includes("ice");
          }

          if (!isImmune) {
            const damage = Math.max(1, Math.floor(p.maxHp / 16));
            const nextHp = Math.max(0, p.hp - damage);
            setCurrentMessage(
              `${p.name.toUpperCase()} was buffeted by the ${finalState.weather}!`,
            );
            await delay(1200);

            finalState =
              side === "player"
                ? {
                    ...finalState,
                    player: { ...p, hp: nextHp },
                    hitSide: "player",
                  }
                : {
                    ...finalState,
                    enemy: { ...p, hp: nextHp },
                    hitSide: "enemy",
                  };

            setState(finalState);
            await delay(600);
            setState((s) => ({ ...s, hitSide: null }));

            const winner = isGameOver(finalState);
            if (winner) {
              handleWinner(winner, finalState);
              return;
            }
          }
        }
      }
    }

    // ── Trap damage ───────────────────────────────────────
    for (const side of ["player", "enemy"] as const) {
      const trapKey = side === "player" ? "playerTrap" : "enemyTrap";
      const trap = finalState[trapKey] as TrapState | undefined;
      if (!trap) continue;

      const p = side === "player" ? finalState.player : finalState.enemy;
      if (p.hp <= 0) continue;

      const damage = Math.max(1, Math.floor(p.maxHp * trap.damagePerTurn));
      const nextHp = Math.max(0, p.hp - damage);

      const moveName = trap.moveId.replace(/-/g, " ").toUpperCase();
      setCurrentMessage(`${p.name.toUpperCase()} is hurt by ${moveName}!`);
      await delay(1200);

      const newTrap: TrapState | undefined =
        trap.turnsLeft <= 1
          ? undefined
          : { ...trap, turnsLeft: trap.turnsLeft - 1 };

      finalState =
        side === "player"
          ? {
              ...finalState,
              player: { ...p, hp: nextHp },
              [trapKey]: newTrap,
              hitSide: "player",
            }
          : {
              ...finalState,
              enemy: { ...p, hp: nextHp },
              [trapKey]: newTrap,
              hitSide: "enemy",
            };

      setState(finalState);
      await delay(600);
      setState((s) => ({ ...s, hitSide: null }));

      if (!newTrap) {
        setCurrentMessage(
          `${p.name.toUpperCase()} was freed from ${moveName}!`,
        );
        await delay(1000);
      }

      const winner = isGameOver(finalState);
      if (winner) {
        handleWinner(winner, finalState);
        return;
      }
    }

    // ── Poison / Burn / Bad-Poison end-of-turn damage ─────
    for (const side of ["player", "enemy"] as const) {
      const p = side === "player" ? finalState.player : finalState.enemy;
      if (p.hp <= 0) continue;
      if (p.status !== "poison" && p.status !== "burn") continue;

      let damage: number;

      const isBadPoison =
        side === "player"
          ? finalState.playerBadPoison
          : finalState.enemyBadPoison;

      if (p.status === "poison" && isBadPoison) {
        // Toxic: damage escalates each turn — 1/16, 2/16, 3/16 … capped at 15/16
        const turnsElapsed = 16 - (p.statusTurns ?? 16); // counts up
        const n = Math.min(15, Math.max(1, turnsElapsed));
        damage = Math.max(1, Math.floor((p.maxHp * n) / 16));

        // Increment the toxic counter by decrementing statusTurns
        const updatedP = {
          ...p,
          statusTurns: Math.max(1, (p.statusTurns ?? 16) - 1),
        };
        finalState =
          side === "player"
            ? { ...finalState, player: updatedP }
            : { ...finalState, enemy: updatedP };
      } else {
        // Regular poison or burn: 1/8 max HP
        damage = Math.max(1, Math.floor(p.maxHp / 8));
      }

      const nextHp = Math.max(0, p.hp - damage);
      const conditionWord =
        p.status === "burn" ? "burn" : isBadPoison ? "bad poison" : "poison";

      setCurrentMessage(
        `${p.name.toUpperCase()} was hurt by its ${conditionWord}!`,
      );
      await delay(1200);

      finalState =
        side === "player"
          ? {
              ...finalState,
              player: { ...finalState.player, hp: nextHp },
              hitSide: "player",
            }
          : {
              ...finalState,
              enemy: { ...finalState.enemy, hp: nextHp },
              hitSide: "enemy",
            };

      setState(finalState);
      await delay(600);
      setState((s) => ({ ...s, hitSide: null }));

      const winner = isGameOver(finalState);
      if (winner) {
        handleWinner(winner, finalState);
        return;
      }
    }

    // ── Clear flinch for next turn ────────────────────────
    finalState = {
      ...finalState,
      playerFlinched: false,
      enemyFlinched: false,
    };

    setState(finalState);

    if (finalState.player.hp <= 0) {
      setCurrentMessage(`${finalState.player.name.toUpperCase()} fainted!`);
      await delay(1200);
      setSwitchModalVisible(true);
    } else {
      setCurrentMessage(null);
    }
  };

  return {
    state,
    currentMessage,
    isPlayerEntering,
    learningPokemon,
    attack,
    handleSwitch,
    // Status Modal
    statusVisible,
    statusMessage,
    handleStatusClose,
    // Swap Modal (Post-Catch)
    swapModalVisible,
    teamMembers,
    handleSwap,
    handleDismissSwap,
    // Switch Modal (Manual/Faint)
    switchModalVisible,
    setSwitchModalVisible,
    // Move Learning
    moveModalVisible,
    pendingMove,
    handleMoveSelection,
    // Evolution
    evolutionVisible,
    evolvingPokemon,
    setEvolutionVisible,
    resolveEvolution,
    // Penalty
    processTurnPenalty,
    // Mega Evolution
    canMegaEvolve,
    handleMegaEvolution,
    isMegaEvolving,
    revertMegaInTeam,
  };
}
