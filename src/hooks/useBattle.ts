import { useEffect, useState } from "react";
import { getAIMove } from "../battle/ai";
import { determineTurnOrder, isGameOver } from "../battle/battleEngine";
import { BattleState, TrapState } from "../battle/battleTypes";
import { useAuth } from "../context/AuthContext";
import { Move, Pokemon } from "../types/pokemon";
import { delay } from "../utils/battleUtils";
import { getWeatherContinueMessage } from "../utils/weatherUtils";

// Modularized components
import { initialStages } from "../battle/battleConstants";
import { useMegaEvolution } from "./battle/useMegaEvolution";
import { useMoveLearning } from "./battle/useMoveLearning";
import { useTeamManagement } from "./battle/useTeamManagement";
import { useEvolution } from "./battle/useEvolution";
import { executeMove, ExecutionContext } from "../battle/moveExecutor";
import { handleWinner as winHandler, WinHandlerContext } from "../battle/winHandler";

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

  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [isPlayerEntering, setIsPlayerEntering] = useState(false);

  // specialized hooks
  const mega = useMegaEvolution(state.player, state.activePlayerIndex, state.team, setState, setCurrentMessage);
  const learning = useMoveLearning(user?.id, setCurrentMessage, onToggleAutoBattle);
  const evo = useEvolution();

  // Engine Contexts
  const execContext: ExecutionContext = { setCurrentMessage, setState };
  
  const getWinContext = (currentState: BattleState): WinHandlerContext => ({
    setCurrentMessage,
    setState,
    promptMoveReplacement: learning.promptMoveReplacement,
    setEvolvingPokemon: evo.setEvolvingPokemon,
    setEvolutionVisible: evo.setEvolutionVisible,
    setResolveEvolution: evo.setResolveEvolution,
    revertMegaInTeam: mega.revertMegaInTeam,
    resetMegaState: mega.resetMegaState,
    onToggleAutoBattle,
    onCheckpoint,
    onBattleEnd,
  });

  const teamMgmt = useTeamManagement(
    user?.id,
    state,
    setState,
    setCurrentMessage,
    setIsPlayerEntering,
    (m: Move, s: "player" | "enemy", st: BattleState) => executeMove(m, s, st, execContext),
    (w: "player" | "enemy", st: BattleState) => winHandler(w, st, getWinContext(st)),
    onSave,
    onBattleEnd,
    mega.isMega,
    (mega as any).basePlayer,
    mega.setIsMega,
    (mega as any).setBasePlayer,
  );

  // ── attack — main turn logic ──────────────────────────────────────────
  const attack = async (playerMoveIndex: number) => {
    if (state.attackingSide || state.dancingSide || state.winner || currentMessage) return;

    const playerMove = state.player.moves[playerMoveIndex];
    if (playerMove.pp <= 0) {
      setCurrentMessage("No PP left for this move!");
      await delay(1000);
      setCurrentMessage(null);
      return;
    }

    const enemyMove = getAIMove(state.enemy, state.player);
    const firstSide = determineTurnOrder(state.player, state.playerStages, playerMove, state.enemy, state.enemyStages, enemyMove);
    const secondSide = firstSide === "player" ? "enemy" : "player";

    const turns = [
      { side: firstSide, move: firstSide === "player" ? playerMove : enemyMove },
      { side: secondSide, move: secondSide === "player" ? playerMove : enemyMove },
    ];

    let currentState = { ...state, playerFlinched: false, enemyFlinched: false };

    for (const turn of turns) {
      if (currentState.player.hp <= 0 || currentState.enemy.hp <= 0) break;
      const attacker = turn.side === "player" ? currentState.player : currentState.enemy;
      let skipTurn = false;

      // Status Checks (Sleep, Freeze, Paralysis, Flinch, Confusion)
      if (attacker.status === "sleep") {
        if (attacker.statusTurns && attacker.statusTurns > 0) {
          setCurrentMessage(`${attacker.name.toUpperCase()} is fast asleep!`);
          await delay(1200);
          const updated = { ...attacker, statusTurns: attacker.statusTurns - 1 };
          currentState = turn.side === "player" ? { ...currentState, player: updated } : { ...currentState, enemy: updated };
          skipTurn = true;
        } else {
          setCurrentMessage(`${attacker.name.toUpperCase()} woke up!`);
          await delay(1200);
          const updated = { ...attacker, status: null, statusTurns: 0 };
          currentState = turn.side === "player" ? { ...currentState, player: updated } : { ...currentState, enemy: updated };
        }
      }

      if (!skipTurn && attacker.status === "freeze") {
        if (Math.random() < 0.2) {
          setCurrentMessage(`${attacker.name.toUpperCase()} thawed out!`);
          await delay(1200);
          const updated = { ...attacker, status: null };
          currentState = turn.side === "player" ? { ...currentState, player: updated } : { ...currentState, enemy: updated };
        } else {
          setCurrentMessage(`${attacker.name.toUpperCase()} is frozen solid!`);
          await delay(1200);
          skipTurn = true;
        }
      }

      if (!skipTurn && attacker.status === "paralysis") {
        if (Math.random() < 0.25) {
          setCurrentMessage(`${attacker.name.toUpperCase()} is paralyzed! It can't move!`);
          await delay(1200);
          skipTurn = true;
        }
      }

      if (!skipTurn && turn.side === secondSide) {
        const wasFlinched = turn.side === "player" ? currentState.playerFlinched : currentState.enemyFlinched;
        if (wasFlinched) {
          setCurrentMessage(`${attacker.name.toUpperCase()} flinched!`);
          await delay(1200);
          currentState = turn.side === "player" ? { ...currentState, playerFlinched: false } : { ...currentState, enemyFlinched: false };
          skipTurn = true;
        }
      }

      if (!skipTurn && attacker.confusionTurns && attacker.confusionTurns > 0) {
        setCurrentMessage(`${attacker.name.toUpperCase()} is confused!`);
        await delay(1200);
        const updated = { ...attacker, confusionTurns: attacker.confusionTurns - 1 };
        currentState = turn.side === "player" ? { ...currentState, player: updated } : { ...currentState, enemy: updated };

        if (updated.confusionTurns === 0) {
          setCurrentMessage(`${attacker.name.toUpperCase()} snapped out of its confusion!`);
          await delay(1200);
        } else if (Math.random() < 0.5) {
          setCurrentMessage(`It hurt itself in its confusion!`);
          await delay(600);
          const confDamage = Math.floor((((2 * attacker.level) / 5 + 2) * 40 * (attacker.attack / attacker.defense)) / 50 + 2);
          const damaged = { ...updated, hp: Math.max(0, updated.hp - confDamage) };
          currentState = turn.side === "player" ? { ...currentState, player: damaged, hitSide: "player" } : { ...currentState, enemy: damaged, hitSide: "enemy" };
          setState(currentState);
          await delay(600);
          setState((s) => ({ ...s, hitSide: null }));
          skipTurn = true;
        }
      }

      if (skipTurn) {
        setState(currentState);
        const winner = isGameOver(currentState);
        if (winner) { winHandler(winner, currentState, getWinContext(currentState)); return; }
        continue;
      }

      if (turn.side === "player") {
        const updatedMoves = [...currentState.player.moves];
        const moveIdx = currentState.player.moves.findIndex((m) => m.name === turn.move.name);
        if (moveIdx !== -1) {
          updatedMoves[moveIdx] = { ...turn.move, pp: turn.move.pp - 1 };
          currentState = { ...currentState, player: { ...currentState.player, moves: updatedMoves } };
        }
      }

      currentState = await executeMove(turn.move, turn.side as "player" | "enemy", currentState, execContext);
      setState(currentState);
      const winner = isGameOver(currentState);
      if (winner) { winHandler(winner, currentState, getWinContext(currentState)); return; }
      await delay(1000);
    }

    // ── End-of-turn effects ────────────────────────────────
    let finalState = { ...currentState };

    // 1. Weather
    if (finalState.weather) {
      setCurrentMessage(getWeatherContinueMessage(finalState.weather));
      await delay(1200);
      finalState = { ...finalState, weatherTurns: finalState.weatherTurns - 1 };
      if (finalState.weatherTurns <= 0) {
        setCurrentMessage("The weather returned to normal.");
        await delay(1200);
        finalState = { ...finalState, weather: null, weatherTurns: 0 };
      }
      if (finalState.weather === "sandstorm" || finalState.weather === "hail") {
        for (const side of ["player", "enemy"] as const) {
          const p = side === "player" ? finalState.player : finalState.enemy;
          if (p.hp <= 0) continue;
          let isImmune = false;
          if (finalState.weather === "sandstorm") isImmune = p.type.some(t => ["rock", "ground", "steel"].includes(t));
          else if (finalState.weather === "hail") isImmune = p.type.includes("ice");
          if (!isImmune) {
            const damage = Math.max(1, Math.floor(p.maxHp / 16));
            const nextHp = Math.max(0, p.hp - damage);
            setCurrentMessage(`${p.name.toUpperCase()} was buffeted by the ${finalState.weather}!`);
            await delay(1200);
            finalState = side === "player" ? { ...finalState, player: { ...p, hp: nextHp }, hitSide: "player" } : { ...finalState, enemy: { ...p, hp: nextHp }, hitSide: "enemy" };
            setState(finalState);
            await delay(600);
            setState(s => ({ ...s, hitSide: null }));
            const winner = isGameOver(finalState);
            if (winner) { winHandler(winner, finalState, getWinContext(finalState)); return; }
          }
        }
      }
    }

    // 2. Trap
    for (const side of ["player", "enemy"] as const) {
      const trapKey = side === "player" ? "playerTrap" : "enemyTrap";
      const trap = finalState[trapKey] as TrapState | undefined;
      if (!trap) continue;
      const p = side === "player" ? finalState.player : finalState.enemy;
      if (p.hp <= 0) continue;
      const damage = Math.max(1, Math.floor(p.maxHp * trap.damagePerTurn));
      const nextHp = Math.max(0, p.hp - damage);
      setCurrentMessage(`${p.name.toUpperCase()} is hurt by ${trap.moveId.toUpperCase()}!`);
      await delay(1200);
      const newTrap = trap.turnsLeft <= 1 ? undefined : { ...trap, turnsLeft: trap.turnsLeft - 1 };
      finalState = side === "player" ? { ...finalState, player: { ...p, hp: nextHp }, [trapKey]: newTrap, hitSide: "player" } : { ...finalState, enemy: { ...p, hp: nextHp }, [trapKey]: newTrap, hitSide: "enemy" };
      setState(finalState);
      await delay(600);
      setState(s => ({ ...s, hitSide: null }));
      if (!newTrap) { setCurrentMessage(`${p.name.toUpperCase()} was freed!`); await delay(1000); }
      const winner = isGameOver(finalState);
      if (winner) { winHandler(winner, finalState, getWinContext(finalState)); return; }
    }

    // 3. Status damage (Poison/Burn)
    for (const side of ["player", "enemy"] as const) {
      const p = side === "player" ? finalState.player : finalState.enemy;
      if (p.hp <= 0 || (p.status !== "poison" && p.status !== "burn")) continue;
      const isBadPoison = side === "player" ? finalState.playerBadPoison : finalState.enemyBadPoison;
      let damage = Math.max(1, Math.floor(p.maxHp / (isBadPoison ? (16 - (p.statusTurns ?? 16)) : 8)));
      if (p.status === "poison" && isBadPoison) {
        const updatedP = { ...p, statusTurns: Math.max(1, (p.statusTurns ?? 16) - 1) };
        finalState = side === "player" ? { ...finalState, player: updatedP } : { ...finalState, enemy: updatedP };
      }
      const nextHp = Math.max(0, p.hp - damage);
      setCurrentMessage(`${p.name.toUpperCase()} was hurt by its status!`);
      await delay(1200);
      finalState = side === "player" ? { ...finalState, player: { ...finalState.player, hp: nextHp }, hitSide: "player" } : { ...finalState, enemy: { ...finalState.enemy, hp: nextHp }, hitSide: "enemy" };
      setState(finalState);
      await delay(600);
      setState(s => ({ ...s, hitSide: null }));
      const winner = isGameOver(finalState);
      if (winner) { winHandler(winner, finalState, getWinContext(finalState)); return; }
    }

    finalState = { ...finalState, playerFlinched: false, enemyFlinched: false };
    setState(finalState);
    if (finalState.player.hp <= 0) {
      setCurrentMessage(`${finalState.player.name.toUpperCase()} fainted!`);
      await delay(1200);
      teamMgmt.setSwitchModalVisible(true);
    } else { setCurrentMessage(null); }
  };

  const processTurnPenalty = async () => {
    if (state.winner || currentMessage) return;
    setCurrentMessage(null);
    await delay(300);
    const enemyMove = getAIMove(state.enemy, state.player);
    const afterEnemyState = await executeMove(enemyMove, "enemy", state, execContext);
    setState(afterEnemyState);
    const winner = isGameOver(afterEnemyState);
    if (winner) { winHandler(winner, afterEnemyState, getWinContext(afterEnemyState)); }
    else if (afterEnemyState.player.hp <= 0) {
      setCurrentMessage(`${afterEnemyState.player.name.toUpperCase()} fainted!`);
      await delay(1200);
      teamMgmt.setSwitchModalVisible(true);
    } else { setCurrentMessage(null); }
  };

  return {
    state,
    currentMessage,
    isPlayerEntering,
    learningPokemon: learning.learningPokemon,
    attack,
    handleSwitch: teamMgmt.handleSwitch,
    statusVisible: teamMgmt.statusVisible,
    statusMessage: teamMgmt.statusMessage,
    handleStatusClose: teamMgmt.handleStatusClose,
    swapModalVisible: teamMgmt.swapModalVisible,
    teamMembers: teamMgmt.teamMembers,
    handleSwap: teamMgmt.handleSwap,
    handleDismissSwap: teamMgmt.handleDismissSwap,
    switchModalVisible: teamMgmt.switchModalVisible,
    setSwitchModalVisible: teamMgmt.setSwitchModalVisible,
    moveModalVisible: learning.moveModalVisible,
    pendingMove: learning.pendingMove,
    handleMoveSelection: learning.handleMoveSelection,
    evolutionVisible: evo.evolutionVisible,
    evolvingPokemon: evo.evolvingPokemon,
    setEvolutionVisible: evo.setEvolutionVisible,
    resolveEvolution: evo.resolveEvolution,
    processTurnPenalty,
    canMegaEvolve: mega.canMegaEvolve,
    handleMegaEvolution: mega.handleMegaEvolution,
    isMegaEvolving: mega.isMegaEvolving,
    revertMegaInTeam: mega.revertMegaInTeam,
  };
}
