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
import EvolutionModal from "../components/evolutionModal";
import PokemonCard from "../components/pokemonCard";
import StatusModal from "../components/statusModal";

import { fetchPokemon } from "../api/pokeApi";
import { getRandomMove } from "../battle/ai";
import {
  dealDamage,
  determineTurnOrder,
  isGameOver,
} from "../battle/battleEngine";
import { BattleState, StatStages } from "../battle/battleTypes";
import { useAuth } from "../context/AuthContext";
import { savePokemon, swapIntoTeam } from "../hooks/savePokemon";
import { supabase } from "../lib/supabase";
import { BattleScreenProps } from "../types/navigation";
import { Move, Pokemon } from "../types/pokemon";
import { checkEvolution } from "../utils/evolutionChecker";
import {
  calculateExpGain,
  checkLevelUp,
  getExpForLevel,
} from "../utils/experienceCalculator";
import { calculateHp, calculateStat } from "../utils/statCalculator";

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
  team: Pokemon[];
  enemy: Pokemon;
  onBattleEnd?: (winner: "player" | "enemy", finalTeam: Pokemon[], didEvolve: boolean) => void;
  onRun?: (finalTeam: Pokemon[]) => void;
  onBagPress?: (player: Pokemon, currentEnemy: Pokemon) => void;
  catchPending?: { item: { id: string; name: string; catchRate: number } };
  onSave?: () => void;
}

export function Battle({
  player,
  team,
  enemy,
  onBattleEnd,
  onRun,
  onBagPress,
  catchPending,
  onSave,
  isAutoBattle = false,
  onToggleAutoBattle,
}: BattleProps & {
  isAutoBattle?: boolean;
  onToggleAutoBattle?: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<BattleState>({
    player,
    team,
    activePlayerIndex: team.findIndex(p => p.id === player.id) || 0,
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

  // Switch Modal State
  const [switchModalVisible, setSwitchModalVisible] = useState(false);

  // ... (rest of states)

  const handleSwitch = async (index: number) => {
    if (index === state.activePlayerIndex) return;
    if (state.team[index].hp <= 0) {
      Alert.alert("Cannot Switch", `${state.team[index].name} has no energy left to battle!`);
      return;
    }

    setSwitchModalVisible(false);
    
    // If it was a manual switch (not forced by fainting), enemy gets a turn
    const isForced = state.player.hp <= 0;
    
    setCurrentMessage(`Go! ${state.team[index].name.toUpperCase()}!`);
    
    const newState: BattleState = {
      ...state,
      player: state.team[index],
      activePlayerIndex: index,
      playerStages: { ...initialStages }, // Reset stages on switch
    };
    setState(newState);
    await delay(1200);

    if (!isForced) {
      // Enemy turn
      const enemyMove = getRandomMove(state.enemy);
      const afterEnemyState = await executeMove(enemyMove, "enemy", newState);
      setState(afterEnemyState);
      
      const winner = isGameOver(afterEnemyState);
      if (winner) {
        handleWinner(winner, afterEnemyState);
      } else if (afterEnemyState.player.hp <= 0) {
        // Player's new pokemon fainted!
        setCurrentMessage(`${afterEnemyState.player.name.toUpperCase()} fainted!`);
        await delay(1200);
        setSwitchModalVisible(true);
      } else {
        setCurrentMessage(null);
      }
    } else {
      setCurrentMessage(null);
    }
  };

  const handleWinner = async (winner: "player" | "enemy", currentState: BattleState) => {
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

        // Handle new moves
        if (levelUp.newMoves.length > 0) {
          for (const move of levelUp.newMoves) {
            await delay(1200);
            setCurrentMessage(
              `${currentState.player.name.toUpperCase()} learned ${move.name.toUpperCase()}!`,
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

        // Check for Evolution
        const evolutionTargetId = checkEvolution(updatedPlayer, updatedPlayer.level);
        if (evolutionTargetId) {
          setCurrentMessage(`What? ${updatedPlayer.name.toUpperCase()} is evolving!`);
          await delay(2000);

          const newSpeciesData = await fetchPokemon(evolutionTargetId.toString());

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
            hp: calculateHp(newSpeciesData.stats.find((s: any) => s.stat.name === 'hp').base_stat, updatedPlayer.level),
            maxHp: calculateHp(newSpeciesData.stats.find((s: any) => s.stat.name === 'hp').base_stat, updatedPlayer.level),
            attack: calculateStat(newSpeciesData.stats.find((s: any) => s.stat.name === 'attack').base_stat, updatedPlayer.level),
            defense: calculateStat(newSpeciesData.stats.find((s: any) => s.stat.name === 'defense').base_stat, updatedPlayer.level),
            specialAttack: calculateStat(newSpeciesData.stats.find((s: any) => s.stat.name === 'special-attack').base_stat, updatedPlayer.level),
            specialDefense: calculateStat(newSpeciesData.stats.find((s: any) => s.stat.name === 'special-defense').base_stat, updatedPlayer.level),
            speed: calculateStat(newSpeciesData.stats.find((s: any) => s.stat.name === 'speed').base_stat, updatedPlayer.level),
          };

          setCurrentMessage(`${evolvingPokemon?.oldName.toUpperCase()} evolved into ${newSpeciesData.name.toUpperCase()}!`);
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
      if (onBattleEnd) onBattleEnd("player", finalTeam, false);
    } else {
      // Enemy won
      setCurrentMessage(
        `${currentState.player.name.toUpperCase()} fainted!`,
      );
      setState((s) => ({ ...s, hitSide: "player" }));
      await delay(2000);
      if (onBattleEnd) onBattleEnd("enemy", currentState.team, false);
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

    // 1. Message
    const prefix = isPlayerAttacking ? "" : "Wild ";
    setCurrentMessage(
      `${prefix}${attacker.name.toUpperCase()} used ${move.name.toUpperCase()}!`,
    );
    await delay(1500);

    let nextPlayerStages = currentState.playerStages;
    let nextEnemyStages = currentState.enemyStages;
    let nextDefenderHp = defender.hp;

    // 2. Animations & Damage
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
      );

      if (isCrit) {
        setCurrentMessage("A critical hit!");
        await delay(1200);
      }

      nextDefenderHp = Math.max(0, defender.hp - damage);
    }

    // 3. Stat Changes
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
    };
    const nextEnemy = {
      ...currentState.enemy,
      hp: isPlayerAttacking ? nextDefenderHp : currentState.enemy.hp,
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
      hitSide: null,
      attackingSide: null,
      dancingSide: null,
    };

    // Show stat change logs if any
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

    // 1. Setup
    const playerMove = state.player.moves[playerMoveIndex];
    if (playerMove.pp <= 0) {
      setCurrentMessage("No PP left for this move!");
      await delay(1000);
      setCurrentMessage(null);
      return;
    }

    const enemyMove = getRandomMove(state.enemy);

    // 2. Determine Order
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

    // 3. Execute Turns
    for (const turn of turns) {
      // Check if someone fainted before their turn
      if (currentState.player.hp <= 0 || currentState.enemy.hp <= 0) break;

      // Handle PP decrement for player
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

    // Check if player fainted and needs to switch
    if (currentState.player.hp <= 0) {
      setCurrentMessage(`${currentState.player.name.toUpperCase()} fainted!`);
      await delay(1200);
      setSwitchModalVisible(true);
    } else {
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
        playerTypes={state.player.type}
        enemyTypes={state.enemy.type}
        onMovePress={attack}
        onPokemonPress={() => setSwitchModalVisible(true)}
        onBagPress={() => onBagPress?.(state.player, state.enemy)}
        onRun={() => onRun?.(state.team)}
        disabled={
          !!state.attackingSide ||
          !!state.dancingSide ||
          !!state.winner ||
          !!currentMessage
        }
        currentLog={currentMessage}
        isAutoBattle={isAutoBattle}
        onToggleAutoBattle={onToggleAutoBattle}
      />

      <StatusModal
        visible={statusVisible}
        message={statusMessage}
        type="success"
        onClose={handleStatusClose}
      />

      <EvolutionModal
        visible={evolutionVisible}
        pokemon={evolvingPokemon}
        onClose={() => {
          setEvolutionVisible(false);
          resolveEvolution?.resolve();
        }}
      />

      <Modal visible={switchModalVisible} transparent animationType="slide">
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
              maxHeight: "80%",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 16,
              }}
            >
              Choose a Pokémon:
            </Text>
            <FlatList
              data={state.team}
              keyExtractor={(p, i) => i.toString()}
              renderItem={({ item, index }) => {
                const isCurrent = index === state.activePlayerIndex;
                const isFainted = item.hp <= 0;
                
                return (
                  <TouchableOpacity
                    onPress={() => handleSwitch(index)}
                    disabled={isCurrent || isFainted}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#374151",
                      gap: 12,
                      opacity: isFainted ? 0.5 : 1,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "white", fontSize: 16 }}>
                        {item.name} {isCurrent && "(On Field)"}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                         <Text style={{ color: "#9CA3AF", fontSize: 12 }}>Lv. {item.level}</Text>
                         <View style={{ flex: 1, height: 4, backgroundColor: '#374151', borderRadius: 2 }}>
                            <View style={{ 
                                width: `${(item.hp / item.maxHp) * 100}%`, 
                                height: '100%', 
                                backgroundColor: item.hp / item.maxHp > 0.5 ? '#22c55e' : item.hp / item.maxHp > 0.2 ? '#f59e0b' : '#ef4444',
                                borderRadius: 2 
                            }} />
                         </View>
                         <Text style={{ color: "white", fontSize: 12 }}>{Math.ceil(item.hp)}/{item.maxHp}</Text>
                      </View>
                    </View>
                    {isFainted && <Text style={{ color: "#EF4444", fontWeight: "bold" }}>FNT</Text>}
                  </TouchableOpacity>
                );
              }}
            />
            {state.player.hp > 0 && (
              <TouchableOpacity
                onPress={() => setSwitchModalVisible(false)}
                style={{ marginTop: 16, alignItems: "center", paddingVertical: 12 }}
              >
                <Text style={{ color: "#9CA3AF" }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

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

      {/* Move Learning Modal */}
      <Modal visible={moveModalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#1F2937",
              borderRadius: 15,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              borderWidth: 1,
              borderColor: "#374151",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Learn a New Move?
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {state.player.name.toUpperCase()} wants to learn{" "}
              {pendingMove?.name.toUpperCase()}. Select a move to replace:
            </Text>

            {/* New Move Info */}
            <View
              style={{
                backgroundColor: "#374151",
                padding: 12,
                borderRadius: 10,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: "#818cf8", fontWeight: "bold" }}>
                  {pendingMove?.name.toUpperCase()}
                </Text>
                <Text style={{ color: "#9CA3AF" }}>
                  {pendingMove?.type?.toUpperCase()}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 4 }}>
                <Text style={{ color: "white", fontSize: 12 }}>
                  PWR: {pendingMove?.power || "-"}
                </Text>
                <Text style={{ color: "white", fontSize: 12 }}>
                  ACC: {pendingMove?.accuracy || "-"}
                </Text>
                <Text style={{ color: "white", fontSize: 12 }}>
                  PP: {pendingMove?.pp}
                </Text>
              </View>
              <Text
                style={{ color: "#D1D5DB", fontSize: 12, fontStyle: "italic" }}
              >
                {pendingMove?.description || "No description available."}
              </Text>
            </View>

            {/* Current Moves */}
            <View style={{ gap: 10 }}>
              {state.player.moves.map((move, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleMoveSelection(index)}
                  style={{
                    backgroundColor: "#111827",
                    padding: 14,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#4B5563",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {move.name.toUpperCase()}
                  </Text>
                  <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                    {move.type?.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => handleMoveSelection("skip")}
              style={{ marginTop: 24, padding: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                STOP LEARNING {pendingMove?.name.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── BattleScreen Wrapper ──────────────────────────────────────────────────

export default function BattleScreen({ route, navigation }: BattleScreenProps) {
  const { player, team, enemy, onRun, isAutoBattle, onToggleAutoBattle } =
    route.params as any;
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
      team={team || [player]}
      enemy={enemy}
      catchPending={catchPending}
      onSave={onSave}
      onBattleEnd={(winner, finalTeam, didEvolve) => {
        setTimeout(() => navigation.goBack(), 2000);
      }}
      onRun={(finalTeam) => {
        if (onRun) onRun(finalTeam);
        else navigation.goBack();
      }}
      onBagPress={(p, e) =>
        navigation.navigate("InventoryBag", {
          player: p,
          team: team,
          pokemon: e,
          fromScreen: "Battle",
        } as any)
      }
      isAutoBattle={isAutoBattle}
      onToggleAutoBattle={onToggleAutoBattle}
    />
  );
}
