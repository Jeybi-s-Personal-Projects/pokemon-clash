import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BattleActions from "../components/battleActions";
import PokemonCard from "../components/pokemonCard";
import StatusModal from "../components/statusModal";

import { getRandomMove } from "../battle/ai";
import { dealDamage, isGameOver } from "../battle/battleEngine";
import { BattleState, StatStages } from "../battle/battleTypes";
import { useAuth } from "../context/AuthContext";
import { savePokemon, swapIntoTeam } from "../hooks/savePokemon";
import { supabase } from "../lib/supabase";
import { BattleScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";
import {
  calculateExpGain,
  checkLevelUp,
  getExpForLevel,
} from "../utils/experienceCalculator";

import { setAudioModeAsync } from "expo-audio";

// We'll define a simple type for the swap list
type TeamMemberForSwap = {
  id: string;
  name: string;
  level: number;
};

const initialStages: StatStages = {
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
};

// ─── Inner Battle component ──────────────────────────────────────────────────

interface BattleProps {
  player: Pokemon;
  enemy: Pokemon;
  onBattleEnd?: (winner: "player" | "enemy", finalPlayer: Pokemon) => void;
  onRun?: (finalPlayer: Pokemon) => void;
  onBagPress?: (player: Pokemon, currentEnemy: Pokemon) => void;
  catchPending?: { item: { id: string; name: string; catchRate: number } };
  onSave?: () => void;
}


export function Battle({
  player,
  enemy,
  onBattleEnd,
  onRun,
  onBagPress,
  catchPending,
  onSave,
}: BattleProps) {
  const { user } = useAuth();
  const [state, setState] = useState<BattleState>({
    player,
    enemy,
    turn: "player",
    log: [],
    winner: null,
    attackingSide: null,
    dancingSide: null,
    hitSide: null,
    playerStages: { ...initialStages },
    enemyStages: { ...initialStages },
  });

  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  // Status Modal & Swap State
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberForSwap[]>([]);
  const [pendingCaughtId, setPendingCaughtId] = useState<string | null>(null);
  const [finalCatchResult, setFinalCatchResult] = useState<any>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // ── Handle Catch from Bag ──
  useEffect(() => {
    if (!catchPending || !user) return;

    const handleCatchSequence = async () => {
      // 1. Return to battle, show "Used ball" message
      setCurrentMessage(
        `PLAYER USED ${catchPending.item.name.toUpperCase()}...`,
      );

      // 2. The "Shaking" Delay
      await delay(2500);

      try {
        // 3. Perform the actual save
        const { data, teamFull } = await savePokemon(enemy, user.id);
        const result = {
          caught: true,
          caughtPokemon: { ...enemy, id: data.id },
          teamFull,
        };
        setFinalCatchResult(result);
        setPendingCaughtId(data.id);

        // 4. GOTCHA message
        setCurrentMessage(`GOTCHA! ${enemy.name.toUpperCase()} was caught!`);
        await delay(1500);

        // 5. Success Modal
        if (teamFull) {
          setStatusMessage(
            `Gotcha! ${enemy.name.toUpperCase()} was caught!\n\nYour team is full, so it was sent to the PC.`,
          );
        } else {
          setStatusMessage(`Gotcha! ${enemy.name.toUpperCase()} was caught!`);
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

      const members: TeamMemberForSwap[] = data.map((p: any) => ({
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
      if (onBattleEnd) onBattleEnd("player", state.player);
    }
  };

  const handleSwap = async (replacedId: string) => {
    try {
      await swapIntoTeam(pendingCaughtId!, replacedId);
      setSwapModalVisible(false);
      if (onSave) onSave();
      if (onBattleEnd) onBattleEnd("player", state.player);
    } catch (e) {
      Alert.alert("Error", "Swap failed.");
    }
  };

  const handleDismissSwap = () => {
    setSwapModalVisible(false);
    if (onSave) onSave();
    if (onBattleEnd) onBattleEnd("player", state.player);
  };

  const applyStatChanges = (
    currentStages: StatStages,
    changes: { stat: string; change: number }[],
    targetName: string,
  ) => {
    const newStages = { ...currentStages };
    let logs: string[] = [];

    changes.forEach((c) => {
      const statKey = c.stat as keyof StatStages;
      if (newStages[statKey] !== undefined) {
        const oldStage = newStages[statKey];
        newStages[statKey] = Math.max(-6, Math.min(6, oldStage + c.change));

        const currentStage = newStages[statKey];
        const stageSign = currentStage > 0 ? "+" : "";

        console.log(
          `[StatChange] ${targetName}: ${statKey} ${oldStage} -> ${currentStage} (change: ${c.change})`,
        );

        if (currentStage === oldStage) {
          logs.push(
            `${targetName.toUpperCase()}'s ${c.stat.toUpperCase()} won't go any higher! (${stageSign}${currentStage})`,
          );
        } else {
          const degree = Math.abs(c.change) >= 2 ? "sharply " : "";
          const direction = c.change > 0 ? "rose" : "fell";
          logs.push(
            `${targetName.toUpperCase()}'s ${c.stat.toUpperCase()} ${degree}${direction}! (${stageSign}${currentStage})`,
          );
        }
      }
    });

    return { newStages, logs };
  };

  const attack = async (index: number) => {
    if (
      state.attackingSide ||
      state.dancingSide ||
      state.winner ||
      currentMessage
    )
      return;

    // 1. Player Turn
    const move = state.player.moves[index];

    // Check PP
    if (move.pp <= 0) {
      setCurrentMessage("No PP left for this move!");
      await delay(1000);
      setCurrentMessage(null);
      return;
    }

    // Decrement PP locally
    const updatedMoves = [...state.player.moves];
    updatedMoves[index] = { ...move, pp: move.pp - 1 };

    setCurrentMessage(`${state.player.name} used ${move.name.toUpperCase()}!`);
    await delay(1500);

    let nextPlayerStages = state.playerStages;
    let nextEnemyStages = state.enemyStages;
    let nextEnemyHp = state.enemy.hp;

    // ... damage logic ...

    // Handle Animations & Damage
    if (move.power === 0) {
      setState((s) => ({ ...s, dancingSide: "player" }));
      await delay(600);
      setState((s) => ({ ...s, dancingSide: null }));
    } else {
      setState((s) => ({ ...s, attackingSide: "player" }));
      await delay(400);
      setState((s) => ({ ...s, hitSide: "enemy", attackingSide: null }));

      const damage = dealDamage(
        state.player,
        state.playerStages,
        state.enemy,
        state.enemyStages,
        move,
      );
      nextEnemyHp = Math.max(0, state.enemy.hp - damage);
    }

    // Apply Stat Changes if any
    if (move.statChanges && move.statChanges.length > 0) {
      const isDebuff = move.statChanges[0].change < 0;
      const targetStages = isDebuff ? state.enemyStages : state.playerStages;
      const targetName = isDebuff ? state.enemy.name : state.player.name;

      const { newStages, logs } = applyStatChanges(
        targetStages,
        move.statChanges,
        targetName,
      );

      if (isDebuff) {
        nextEnemyStages = newStages;
      } else {
        nextPlayerStages = newStages;
      }

      for (const log of logs) {
        setCurrentMessage(null);
        setCurrentMessage(log);
        await delay(1200);
      }
    }

    const afterPlayerAttack: BattleState = {
      ...state,
      player: { ...state.player, moves: updatedMoves },
      enemy: { ...state.enemy, hp: nextEnemyHp },
      playerStages: nextPlayerStages,
      enemyStages: nextEnemyStages,
      hitSide: null,
      attackingSide: null,
      dancingSide: null,
    };

    const winnerAfterPlayer = isGameOver(afterPlayerAttack);
    if (winnerAfterPlayer === "player") {
      setState({ ...afterPlayerAttack, winner: "player" });
      await delay(1200);
      setCurrentMessage(`The wild ${state.enemy.name.toUpperCase()} fainted!`);

      const expGain = calculateExpGain(
        state.enemy.level,
        state.enemy.speciesId,
        true,
      );
      await delay(1200);
      setCurrentMessage(
        `${state.player.name.toUpperCase()} gained ${expGain} EXP!`,
      );

      const levelUp = checkLevelUp(state.player, expGain);
      let updatedPlayer = { ...state.player };

      if (levelUp) {
        await delay(1200);
        setCurrentMessage(
          `${state.player.name.toUpperCase()} grew to Level ${levelUp.newLevel}!`,
        );

        updatedPlayer = {
          ...state.player,
          level: levelUp.newLevel,
          experience: levelUp.totalExp,
          ...levelUp.stats,
        };

        // Handle new moves
        if (levelUp.newMoves.length > 0) {
          for (const move of levelUp.newMoves) {
            await delay(1200);
            setCurrentMessage(
              `${state.player.name.toUpperCase()} learned ${move.name.toUpperCase()}!`,
            );
            if (updatedPlayer.moves.length < 4) {
              updatedPlayer.moves = [...updatedPlayer.moves, move];
              // Save move to DB
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
            }
          }
        }
      } else {
        updatedPlayer.experience += expGain;
      }

      setState((s) => ({ ...s, player: updatedPlayer }));
      
      await delay(1500);
      if (onBattleEnd) onBattleEnd("player", updatedPlayer);
      return;
    }

    setState(afterPlayerAttack);
    await delay(1000);

    // 2. Enemy Turn
    const enemyMove = getRandomMove(state.enemy);
    setState((s) => ({ ...s, turn: "enemy" }));
    setCurrentMessage(
      `Wild ${state.enemy.name.toUpperCase()} used ${enemyMove.name.toUpperCase()}!`,
    );
    await delay(1500);

    let nextPlayerHp = state.player.hp;
    let nextEnemyStages_enemyTurn = nextEnemyStages;
    let nextPlayerStages_enemyTurn = nextPlayerStages;

    if (enemyMove.power === 0) {
      setState((s) => ({ ...s, dancingSide: "enemy" }));
      await delay(600);
      setState((s) => ({ ...s, dancingSide: null }));
    } else {
      setState((s) => ({ ...s, attackingSide: "enemy" }));
      await delay(400);
      setState((s) => ({ ...s, hitSide: "player", attackingSide: null }));

      const damage = dealDamage(
        state.enemy,
        nextEnemyStages,
        state.player,
        nextPlayerStages,
        enemyMove,
      );
      nextPlayerHp = Math.max(0, state.player.hp - damage);
    }

    if (enemyMove.statChanges && enemyMove.statChanges.length > 0) {
      const isDebuff = enemyMove.statChanges[0].change < 0;
      const targetStages = isDebuff ? nextPlayerStages : nextEnemyStages;
      const targetName = isDebuff ? state.player.name : state.enemy.name;

      const { newStages, logs } = applyStatChanges(
        targetStages,
        enemyMove.statChanges,
        targetName,
      );

      if (isDebuff) {
        nextPlayerStages_enemyTurn = newStages;
      } else {
        nextEnemyStages_enemyTurn = newStages;
      }

      for (const log of logs) {
        setCurrentMessage(null);
        setCurrentMessage(log);
        await delay(1200);
      }
    }

    const afterEnemyAttack: BattleState = {
      ...afterPlayerAttack,
      player: { ...afterPlayerAttack.player, hp: nextPlayerHp },
      enemyStages: nextEnemyStages_enemyTurn,
      playerStages: nextPlayerStages_enemyTurn,
      turn: "player",
      hitSide: null,
      attackingSide: null,
      dancingSide: null,
    };

    const winnerAfterEnemy = isGameOver(afterEnemyAttack);
    if (winnerAfterEnemy) {
      setState({ ...afterEnemyAttack, winner: winnerAfterEnemy });
      
      if (winnerAfterEnemy === "enemy") {
        setCurrentMessage(`${state.player.name.toUpperCase()} fainted!`);
        setState(s => ({ ...s, hitSide: "player" })); // Reuse hitSide for a visual indicator or add fainted state
        await delay(2000);
      } else {
        setCurrentMessage(`The wild ${state.enemy.name.toUpperCase()} fainted!`);
        await delay(1500);
      }
      
      if (onBattleEnd) onBattleEnd(winnerAfterEnemy, afterEnemyAttack.player);
    } else {
      setState(afterEnemyAttack);
      setCurrentMessage(null);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "space-between",
        backgroundColor: "#1F2937",
      }}
    >
      <View
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 10 }}
      >
        <PokemonCard
          pokemon={state.enemy}
          stages={state.enemyStages}
          isAttacking={state.attackingSide === "enemy"}
          isDancing={state.dancingSide === "enemy"}
          isHit={state.hitSide === "enemy"}
        />
        <View style={{ height: 100 }} />
        <PokemonCard
          pokemon={state.player}
          stages={state.playerStages}
          isBack={true}
          isAttacking={state.attackingSide === "player"}
          isDancing={state.dancingSide === "player"}
          isHit={state.hitSide === "player"}
          exp={
            state.player.experience -
            getExpForLevel(
              state.player.level,
              state.player.growthRate || "medium-fast",
            )
          }
          maxExp={
            getExpForLevel(
              state.player.level + 1,
              state.player.growthRate || "medium-fast",
            ) -
            getExpForLevel(
              state.player.level,
              state.player.growthRate || "medium-fast",
            )
          }
        />
      </View>

      <BattleActions
        moves={state.player.moves}
        enemyTypes={state.enemy.type}
        onMovePress={attack}
        onBagPress={() => onBagPress?.(state.player, state.enemy)}
        onRun={() => onRun?.(state.player)}
        disabled={
          !!state.attackingSide ||
          !!state.dancingSide ||
          !!state.winner ||
          !!currentMessage
        }
        currentLog={currentMessage}
      />

      <StatusModal
        visible={statusVisible}
        message={statusMessage}
        type="success"
        onClose={handleStatusClose}
      />

      <Modal visible={swapModalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        >
          <View
            style={{
              backgroundColor: "#1F2937",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "60%",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              Your team is full!
            </Text>
            <Text style={{ color: "#9CA3AF", marginBottom: 16 }}>
              Choose a Pokémon to send to the box:
            </Text>
            <FlatList
              data={teamMembers}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSwap(item.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#374151",
                    gap: 12,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16, flex: 1 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: "#6B7280" }}>Lv. {item.level}</Text>
                  <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                    Box
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={handleDismissSwap}
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text style={{ color: "#9CA3AF" }}>Keep current team</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── BattleScreen Wrapper ──────────────────────────────────────────────────

export default function BattleScreen({ route, navigation }: BattleScreenProps) {
  const { player, enemy, onRun } = route.params;
  const catchPending = route.params.catchPending;
  const onSave = (route.params as any).onSave;

  // Clear catchPending after it's been "consumed" by the state
  useEffect(() => {
    if (catchPending) {
      // Small timeout to ensure it propagates once before clearing
      const timer = setTimeout(() => {
        navigation.setParams({ catchPending: undefined } as any);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [catchPending]);

  return (
    <Battle
      player={player}
      enemy={enemy}
      catchPending={catchPending}
      onSave={onSave}
      onBattleEnd={(winner, finalPlayer) => {
        setTimeout(() => navigation.goBack(), 2000);
      }}
      onRun={(finalPlayer) => {
        if (onRun) onRun();
        else navigation.goBack();
      }}
      onBagPress={(p, e) =>
        navigation.navigate("InventoryBag", {
          player: p,
          pokemon: e,
          fromScreen: "Battle",
        } as any)
      }
    />
  );
}
