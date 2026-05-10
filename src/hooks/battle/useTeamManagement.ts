import { useState } from "react";
import { Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import { swapIntoTeam } from "../savePokemon";
import { Pokemon } from "../../types/pokemon";
import { BattleState } from "../../battle/battleTypes";
import { initialStages } from "../../battle/battleConstants";
import { getAIMove } from "../../battle/ai";
import { delay } from "../../utils/battleUtils";
import { isGameOver } from "../../battle/battleEngine";
import { processSwitchInAbilities } from "../../battle/abilityHandler";

export function useTeamManagement(
  userId: string | undefined,
  state: BattleState,
  setState: React.Dispatch<React.SetStateAction<BattleState>>,
  setCurrentMessage: (msg: string | null) => void,
  setIsPlayerEntering: (v: boolean) => void,
  executeMove: any,
  handleWinner: any,
  onSave?: () => void,
  onBattleEnd?: any,
  isMega?: boolean,
  basePlayer?: Pokemon | null,
  setIsMega?: (v: boolean) => void,
  setBasePlayer?: (v: Pokemon | null) => void,
) {
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [pendingCaughtId, setPendingCaughtId] = useState<string | null>(null);
  const [finalCatchResult, setFinalCatchResult] = useState<any>(null);
  const [switchModalVisible, setSwitchModalVisible] = useState(false);

  const loadTeamForSwap = async (caughtId: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("pokemon")
        .select("id, pk_name, pk_level")
        .eq("user_id", userId)
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
      if (setIsMega) setIsMega(false);
      if (setBasePlayer) setBasePlayer(null);
    }

    setCurrentMessage(`Go! ${state.team[index].name.toUpperCase()}!`);
    await delay(1200);

    let newState: BattleState = {
      ...state,
      player: state.team[index],
      activePlayerIndex: index,
      playerStages: { ...initialStages },
      playerCharge: undefined,
      playerTrap: undefined,
      playerFlinched: false,
      playerProtected: false,
      enemyProtected: false,
      playerBadPoison: false,
    };

    // ── Process Switch-in Abilities ──
    const abilityResult = await processSwitchInAbilities("player", newState);
    newState = abilityResult.newState;
    
    setState(newState);
    setIsPlayerEntering(true);

    for (const msg of abilityResult.messages) {
      setCurrentMessage(msg);
      await delay(1200);
    }

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

  return {
    statusVisible,
    setStatusVisible,
    statusMessage,
    setStatusMessage,
    swapModalVisible,
    teamMembers,
    finalCatchResult,
    setFinalCatchResult,
    pendingCaughtId,
    setPendingCaughtId,
    switchModalVisible,
    setSwitchModalVisible,
    loadTeamForSwap,
    handleStatusClose,
    handleSwap,
    handleDismissSwap,
    handleSwitch,
  };
}
