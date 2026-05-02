import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { fetchPokemon } from "../api/pokeApi";
import { getRandomMove } from "../battle/ai";
import {
  dealDamage,
  determineTurnOrder,
  isGameOver,
} from "../battle/battleEngine";
import { BattleState, StatStages, WeatherCondition } from "../battle/battleTypes";
import { useAuth } from "../context/AuthContext";
import { savePokemon, swapIntoTeam } from "../hooks/savePokemon";
import { supabase } from "../lib/supabase";
import { Move, Pokemon } from "../types/pokemon";
import { checkEvolution } from "../utils/evolutionChecker";
import {
  calculateExpGain,
  checkLevelUp,
  getExpForLevel,
} from "../utils/experienceCalculator";
import { calculateHp, calculateStat } from "../utils/statCalculator";
import { applyStatChanges, delay } from "../utils/battleUtils";
import { MOVE_STATUS_MAP, getStatusDuration } from "../utils/statusUtils";
import { MOVE_WEATHER_MAP, getWeatherStartMessage, getWeatherContinueMessage } from "../utils/weatherUtils";

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
  onSave?: () => void;
  catchPending?: { item: { id: string; name: string; catchRate: number } };
  onToggleAutoBattle?: (v: boolean) => void;
}

export function useBattle({
  player,
  team,
  enemy,
  onBattleEnd,
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
  });

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

  const promptMoveReplacement = (newMove: Move): Promise<Move[]> => {
    return new Promise((resolve) => {
      setPendingMove(newMove);
      setMoveModalVisible(true);
      setResolveMoveLearning({ resolve });
    });
  };

  const handleMoveSelection = async (index: number | "skip") => {
    if (!resolveMoveLearning || !pendingMove) return;

    let updatedMoves = [...state.player.moves];

    if (index !== "skip") {
      const oldMove = updatedMoves[index];
      updatedMoves[index] = pendingMove;

      if (user && state.player.id) {
        await supabase
          .from("pokemon_moves")
          .delete()
          .eq("pokemon_id", state.player.id)
          .eq("move_name", oldMove.name);

        await supabase.from("pokemon_moves").insert({
          pokemon_id: state.player.id,
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
        `${state.player.name} forgot ${oldMove.name.toUpperCase()} and learned ${pendingMove.name.toUpperCase()}!`,
      );
    } else {
      setCurrentMessage(
        `${state.player.name} did not learn ${pendingMove.name.toUpperCase()}.`,
      );
    }

    setMoveModalVisible(false);
    await delay(1500);
    resolveMoveLearning.resolve(updatedMoves);
    setPendingMove(null);
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

        setCurrentMessage(`GOTCHA! ${state.enemy.name.toUpperCase()} was caught!`);
        await delay(1500);

        if (teamFull) {
          setStatusMessage(
            `Gotcha! ${state.enemy.name.toUpperCase()} was caught!\n\nYour team is full, so it was sent to the PC.`,
          );
        } else {
          setStatusMessage(`Gotcha! ${state.enemy.name.toUpperCase()} was caught!`);
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
      if (onBattleEnd) onBattleEnd("player", state.team, false, state.activePlayerIndex);
    }
  };

  const handleSwap = async (replacedId: string) => {
    try {
      await swapIntoTeam(pendingCaughtId!, replacedId);
      setSwapModalVisible(false);
      if (onSave) onSave();
      if (onBattleEnd) onBattleEnd("player", state.team, false, state.activePlayerIndex);
    } catch (e) {
      Alert.alert("Error", "Swap failed.");
    }
  };

  const handleDismissSwap = () => {
    setSwapModalVisible(false);
    if (onSave) onSave();
    if (onBattleEnd) onBattleEnd("player", state.team, false, state.activePlayerIndex);
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
    
    setCurrentMessage(`Go! ${state.team[index].name.toUpperCase()}!`);
    
    // Slow delay before the sprite appears
    await delay(1200);

    const newState: BattleState = {
      ...state,
      player: state.team[index],
      activePlayerIndex: index,
      playerStages: { ...initialStages },
    };
    
    setState(newState);
    setIsPlayerEntering(true);
    
    // Quick delay for fade-in animation
    await delay(600);
    setIsPlayerEntering(false);

    if (!isForced) {
      const enemyMove = getRandomMove(state.enemy);
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

      const expGain = calculateExpGain(
        currentState.enemy.level,
        currentState.enemy.speciesId,
        true,
      );
      await delay(1200);
      setCurrentMessage(
        `${currentState.player.name.toUpperCase()} gained ${expGain} EXP!`,
      );

      const levelUp = checkLevelUp(currentState.player, expGain);
      let updatedPlayer = { ...currentState.player };

      if (levelUp) {
        await delay(1200);
        setCurrentMessage(
          `${currentState.player.name.toUpperCase()} grew to Level ${levelUp.newLevel}!`,
        );

        updatedPlayer = {
          ...currentState.player,
          level: levelUp.newLevel,
          experience: levelUp.totalExp,
          ...levelUp.stats,
        };

        if (levelUp.newMoves.length > 0) {
          for (const move of levelUp.newMoves) {
            await delay(1200);
            setCurrentMessage(
              `${currentState.player.name.toUpperCase()} learned ${move.name.toUpperCase()}!`,
            );
            if (updatedPlayer.moves.length < 4) {
              updatedPlayer.moves = [...updatedPlayer.moves, move];
              await supabase.from("pokemon_moves").insert({
                pokemon_id: updatedPlayer.id,
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
              setCurrentMessage(
                `${currentState.player.name.toUpperCase()} wants to learn ${move.name.toUpperCase()}...`,
              );
              await delay(1500);
              setCurrentMessage(
                `But ${currentState.player.name.toUpperCase()} already knows 4 moves!`,
              );
              await delay(1500);

              const newMoveset = await promptMoveReplacement(move);
              updatedPlayer.moves = newMoveset;
            }
          }
        }

        const evolutionTargetId = checkEvolution(
          updatedPlayer,
          updatedPlayer.level,
        );
        if (evolutionTargetId) {
          setCurrentMessage(
            `What? ${updatedPlayer.name.toUpperCase()} is evolving!`,
          );
          await delay(2000);

          const newSpeciesData = await fetchPokemon(
            evolutionTargetId.toString(),
          );

          const evolve = new Promise<void>((resolve) => {
            setEvolvingPokemon({
              oldName: updatedPlayer.name,
              newSpeciesId: evolutionTargetId,
              newName: newSpeciesData.name,
              spriteUrl: newSpeciesData.sprites.other.showdown.front_default,
            });
            setEvolutionVisible(true);
            setResolveEvolution({ resolve });
          });

          await evolve;

          updatedPlayer = {
            ...updatedPlayer,
            speciesId: evolutionTargetId,
            name: newSpeciesData.name,
            type: newSpeciesData.types.map((t: any) => t.type.name),
            frontImage: newSpeciesData.sprites.other.showdown.front_default,
            backImage: newSpeciesData.sprites.other.showdown.back_default,
            hp: calculateHp(
              newSpeciesData.stats.find((s: any) => s.stat.name === "hp")
                .base_stat,
              updatedPlayer.level,
            ),
            maxHp: calculateHp(
              newSpeciesData.stats.find((s: any) => s.stat.name === "hp")
                .base_stat,
              updatedPlayer.level,
            ),
            attack: calculateStat(
              newSpeciesData.stats.find((s: any) => s.stat.name === "attack")
                .base_stat,
              updatedPlayer.level,
            ),
            defense: calculateStat(
              newSpeciesData.stats.find((s: any) => s.stat.name === "defense")
                .base_stat,
              updatedPlayer.level,
            ),
            specialAttack: calculateStat(
              newSpeciesData.stats.find(
                (s: any) => s.stat.name === "special-attack",
              ).base_stat,
              updatedPlayer.level,
            ),
            specialDefense: calculateStat(
              newSpeciesData.stats.find(
                (s: any) => s.stat.name === "special-defense",
              ).base_stat,
              updatedPlayer.level,
            ),
            speed: calculateStat(
              newSpeciesData.stats.find((s: any) => s.stat.name === "speed")
                .base_stat,
              updatedPlayer.level,
            ),
          };

          setCurrentMessage(
            `${evolvingPokemon?.oldName.toUpperCase()} evolved into ${newSpeciesData.name.toUpperCase()}!`,
          );
          await delay(2000);
          if (onToggleAutoBattle) onToggleAutoBattle(false);
        }
      } else {
        updatedPlayer.experience += expGain;
      }

      const finalTeam = [...currentState.team];
      finalTeam[currentState.activePlayerIndex] = updatedPlayer;

      setState((s) => ({ ...s, player: updatedPlayer, team: finalTeam }));
      await delay(1500);
      if (onBattleEnd) onBattleEnd("player", finalTeam, false, currentState.activePlayerIndex);
    } else {
      setCurrentMessage(`${currentState.player.name.toUpperCase()} fainted!`);
      setState((s) => ({ ...s, hitSide: "player" }));
      await delay(2000);
      if (onBattleEnd) onBattleEnd("enemy", currentState.team, false, currentState.activePlayerIndex);
    }
  };

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

    let nextPlayerStages = currentState.playerStages;
    let nextEnemyStages = currentState.enemyStages;
    let nextDefenderHp = defender.hp;
    let nextDefenderStatus = defender.status;
    let nextDefenderStatusTurns = defender.statusTurns;
    let nextDefenderConfusionTurns = defender.confusionTurns;
    let nextWeather = currentState.weather;
    let nextWeatherTurns = currentState.weatherTurns;

    if (move.power === 0) {
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

      if (isCrit) {
        setCurrentMessage("A critical hit!");
        await delay(1200);
      }

      nextDefenderHp = Math.max(0, defender.hp - damage);
    }

    // Handle Status Infliction
    const statusEffect = MOVE_STATUS_MAP[move.name.toLowerCase()];
    if (statusEffect && nextDefenderHp > 0) {
      const roll = Math.random() * 100;
      if (roll < statusEffect.chance) {
        if (statusEffect.isVolatile) {
          if (!nextDefenderConfusionTurns) {
            nextDefenderConfusionTurns = getStatusDuration("confusion");
            setCurrentMessage(null);
            setCurrentMessage(`${defender.name.toUpperCase()} became confused!`);
            await delay(1200);
          }
        } else if (!nextDefenderStatus) {
          nextDefenderStatus = statusEffect.status;
          nextDefenderStatusTurns = getStatusDuration(statusEffect.status);
          
          let statusMsg = "";
          switch (nextDefenderStatus) {
            case "poison": statusMsg = `${defender.name.toUpperCase()} was poisoned!`; break;
            case "burn": statusMsg = `${defender.name.toUpperCase()} was burned!`; break;
            case "paralysis": statusMsg = `${defender.name.toUpperCase()} is paralyzed! It may be unable to move!`; break;
            case "sleep": statusMsg = `${defender.name.toUpperCase()} fell asleep!`; break;
            case "freeze": statusMsg = `${defender.name.toUpperCase()} was frozen solid!`; break;
          }
          
          setCurrentMessage(null);
          setCurrentMessage(statusMsg);
          await delay(1200);
        }
      }
    }

    // Handle Weather Infliction
    const weatherEffect = MOVE_WEATHER_MAP[move.name.toLowerCase()];
    if (weatherEffect) {
      nextWeather = weatherEffect.weather;
      nextWeatherTurns = weatherEffect.duration;
      setCurrentMessage(null);
      setCurrentMessage(getWeatherStartMessage(nextWeather));
      await delay(1200);
    }

    let moveLogs: string[] = [];
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

      if (targetSide === "player") {
        nextPlayerStages = newStages;
      } else {
        nextEnemyStages = newStages;
      }
      moveLogs = logs;
    }

    const nextPlayer = {
      ...currentState.player,
      hp: isPlayerAttacking ? currentState.player.hp : nextDefenderHp,
      status: isPlayerAttacking ? currentState.player.status : nextDefenderStatus,
      statusTurns: isPlayerAttacking ? currentState.player.statusTurns : nextDefenderStatusTurns,
      confusionTurns: isPlayerAttacking ? currentState.player.confusionTurns : nextDefenderConfusionTurns,
    };
    const nextEnemy = {
      ...currentState.enemy,
      hp: isPlayerAttacking ? nextDefenderHp : currentState.enemy.hp,
      status: isPlayerAttacking ? nextDefenderStatus : currentState.enemy.status,
      statusTurns: isPlayerAttacking ? nextDefenderStatusTurns : currentState.enemy.statusTurns,
      confusionTurns: isPlayerAttacking ? nextDefenderConfusionTurns : currentState.enemy.confusionTurns,
    };

    const nextTeam = [...currentState.team];
    nextTeam[currentState.activePlayerIndex] = nextPlayer;

    const updatedState: BattleState = {
      ...currentState,
      player: nextPlayer,
      enemy: nextEnemy,
      team: nextTeam,
      playerStages: nextPlayerStages,
      enemyStages: nextEnemyStages,
      weather: nextWeather,
      weatherTurns: nextWeatherTurns,
      hitSide: null,
      attackingSide: null,
      dancingSide: null,
    };

    for (const log of moveLogs) {
      setCurrentMessage(null);
      setCurrentMessage(log);
      await delay(1200);
    }

    return updatedState;
  };

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

    const enemyMove = getRandomMove(state.enemy);

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

    for (const turn of turns) {
      if (currentState.player.hp <= 0 || currentState.enemy.hp <= 0) break;

      const activeAttacker = turn.side === "player" ? currentState.player : currentState.enemy;
      
      // 1. Status Checks (Can Move?)
      let skipTurn = false;
      
      // Sleep check
      if (activeAttacker.status === "sleep") {
        if (activeAttacker.statusTurns && activeAttacker.statusTurns > 0) {
          setCurrentMessage(`${activeAttacker.name.toUpperCase()} is fast asleep!`);
          await delay(1200);
          
          const updatedAttacker = { ...activeAttacker, statusTurns: activeAttacker.statusTurns - 1 };
          if (turn.side === "player") {
            currentState = { ...currentState, player: updatedAttacker };
          } else {
            currentState = { ...currentState, enemy: updatedAttacker };
          }
          skipTurn = true;
        } else {
          setCurrentMessage(`${activeAttacker.name.toUpperCase()} woke up!`);
          await delay(1200);
          const updatedAttacker = { ...activeAttacker, status: null, statusTurns: 0 };
          if (turn.side === "player") {
            currentState = { ...currentState, player: updatedAttacker };
          } else {
            currentState = { ...currentState, enemy: updatedAttacker };
          }
        }
      }
      
      // Freeze check
      if (!skipTurn && activeAttacker.status === "freeze") {
        if (Math.random() < 0.2) {
          setCurrentMessage(`${activeAttacker.name.toUpperCase()} thawed out!`);
          await delay(1200);
          const updatedAttacker = { ...activeAttacker, status: null };
          if (turn.side === "player") {
            currentState = { ...currentState, player: updatedAttacker };
          } else {
            currentState = { ...currentState, enemy: updatedAttacker };
          }
        } else {
          setCurrentMessage(`${activeAttacker.name.toUpperCase()} is frozen solid!`);
          await delay(1200);
          skipTurn = true;
        }
      }
      
      // Paralysis check
      if (!skipTurn && activeAttacker.status === "paralysis") {
        if (Math.random() < 0.25) {
          setCurrentMessage(`${activeAttacker.name.toUpperCase()} is paralyzed! It can't move!`);
          await delay(1200);
          skipTurn = true;
        }
      }
      
      // Confusion check
      if (!skipTurn && activeAttacker.confusionTurns && activeAttacker.confusionTurns > 0) {
        setCurrentMessage(`${activeAttacker.name.toUpperCase()} is confused!`);
        await delay(1200);
        
        const updatedAttacker = { ...activeAttacker, confusionTurns: activeAttacker.confusionTurns - 1 };
        if (turn.side === "player") currentState = { ...currentState, player: updatedAttacker };
        else currentState = { ...currentState, enemy: updatedAttacker };
        
        if (updatedAttacker.confusionTurns === 0) {
           setCurrentMessage(`${activeAttacker.name.toUpperCase()} snapped out of its confusion!`);
           await delay(1200);
        } else if (Math.random() < 0.5) {
          setCurrentMessage(`It hurt itself in its confusion!`);
          await delay(600);
          
          // Confusion damage: Power 40 physical move
          const confDamage = Math.floor(((((2 * activeAttacker.level) / 5 + 2) * 40 * (activeAttacker.attack / activeAttacker.defense)) / 50 + 2));
          const damagedAttacker = { ...updatedAttacker, hp: Math.max(0, updatedAttacker.hp - confDamage) };
          
          if (turn.side === "player") {
            currentState = { ...currentState, player: damagedAttacker, hitSide: "player" };
          } else {
            currentState = { ...currentState, enemy: damagedAttacker, hitSide: "enemy" };
          }
          setState(currentState);
          await delay(600);
          setState(s => ({ ...s, hitSide: null }));
          skipTurn = true;
        }
      }

      if (skipTurn) {
        setState(currentState);
        const winner = isGameOver(currentState);
        if (winner) { handleWinner(winner, currentState); return; }
        continue;
      }

      // 2. Decrement PP for player
      if (turn.side === "player") {
        const updatedMoves = [...currentState.player.moves];
        const moveIdx = currentState.player.moves.findIndex(
          (m) => m.name === turn.move.name,
        );
        if (moveIdx !== -1) {
          updatedMoves[moveIdx] = { ...turn.move, pp: turn.move.pp - 1 };
          currentState.player.moves = updatedMoves;
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

    // 3. End of Turn Damage (Poison / Burn / Weather)
    let finalState = { ...currentState };
    
    // Weather effects
    if (finalState.weather) {
      setCurrentMessage(null);
      setCurrentMessage(getWeatherContinueMessage(finalState.weather));
      await delay(1200);

      // Decrement weather duration
      finalState.weatherTurns -= 1;
      if (finalState.weatherTurns === 0) {
        setCurrentMessage(null);
        setCurrentMessage("The weather returned to normal.");
        await delay(1200);
        finalState.weather = null;
      }

      // Chip damage from weather (Sandstorm / Hail)
      if (finalState.weather === "sandstorm" || finalState.weather === "hail") {
        const sides: ("player" | "enemy")[] = ["player", "enemy"];
        for (const side of sides) {
          const p = side === "player" ? finalState.player : finalState.enemy;
          if (p.hp <= 0) continue;

          // Immunities
          let isImmune = false;
          if (finalState.weather === "sandstorm") {
            isImmune = p.type.some(t => ["rock", "ground", "steel"].includes(t));
          } else if (finalState.weather === "hail") {
            isImmune = p.type.includes("ice");
          }

          if (!isImmune) {
            const damage = Math.floor(p.maxHp / 16);
            const nextHp = Math.max(0, p.hp - damage);
            setCurrentMessage(null);
            setCurrentMessage(`${p.name.toUpperCase()} was buffeted by the ${finalState.weather}!`);
            await delay(1200);
            
            if (side === "player") finalState = { ...finalState, player: { ...p, hp: nextHp }, hitSide: "player" };
            else finalState = { ...finalState, enemy: { ...p, hp: nextHp }, hitSide: "enemy" };
            
            setState(finalState);
            await delay(600);
            setState(s => ({ ...s, hitSide: null }));
            
            const winner = isGameOver(finalState);
            if (winner) { handleWinner(winner, finalState); return; }
          }
        }
      }
    }

    // Status effects
    const participants: ("player" | "enemy")[] = ["player", "enemy"];
    for (const side of participants) {
      const p = side === "player" ? finalState.player : finalState.enemy;
      if (p.hp > 0 && (p.status === "poison" || p.status === "burn")) {
        const damage = Math.floor(p.maxHp / 8);
        const nextHp = Math.max(0, p.hp - damage);
        
        setCurrentMessage(null);
        setCurrentMessage(`${p.name.toUpperCase()} was hurt by its ${p.status}!`);
        await delay(1200);
        
        if (side === "player") finalState = { ...finalState, player: { ...p, hp: nextHp }, hitSide: "player" };
        else finalState = { ...finalState, enemy: { ...p, hp: nextHp }, hitSide: "enemy" };
        
        setState(finalState);
        await delay(600);
        setState(s => ({ ...s, hitSide: null }));
        
        const winner = isGameOver(finalState);
        if (winner) { handleWinner(winner, finalState); return; }
      }
    }

    // FINAL UPDATE: Ensure all state changes (like weatherTurns) are applied
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
  };
}
