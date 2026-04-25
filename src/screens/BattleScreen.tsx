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

import { getRandomMove } from "../battle/ai";
import { dealDamage, isGameOver } from "../battle/battleEngine";
import { BattleState } from "../battle/battleTypes";
import { useAuth } from "../context/AuthContext";
import { swapIntoTeam } from "../hooks/savePokemon";
import { supabase } from "../lib/supabase";
import { BattleScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";

import { setAudioModeAsync } from "expo-audio";

// We'll define a simple type for the swap list
type TeamMemberForSwap = {
  id: string;
  name: string;
  level: number;
};

// ─── Inner Battle component (unchanged) ──────────────────────────────────────

interface BattleProps {
  player: Pokemon;
  enemy: Pokemon;
  onBattleEnd?: (winner: "player" | "enemy") => void;
  onRun?: () => void;
  onBagPress?: () => void;
}

export function Battle({
  player,
  enemy,
  onBattleEnd,
  onRun,
  onBagPress,
}: BattleProps) {
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const [state, setState] = useState<BattleState>({
    player,
    enemy,
    turn: "player",
    log: [],
    winner: null,
    attackingSide: null,
    hitSide: null,
  });

  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const attack = async (index: number) => {
    if (state.attackingSide || state.winner || currentMessage) return;

    // 1. Player Turn
    const move = state.player.moves[index];

    setCurrentMessage(`${state.player.name} used ${move.name.toUpperCase()}!`);
    await delay(1500);

    setState((s) => ({ ...s, attackingSide: "player" }));
    await delay(400);
    setState((s) => ({ ...s, hitSide: "enemy", attackingSide: null }));

    const newEnemyHp = dealDamage(state.enemy.hp, move, state.enemy.type);
    const afterPlayerAttack: BattleState = {
      ...state,
      enemy: { ...state.enemy, hp: newEnemyHp },
      hitSide: null,
      attackingSide: null,
    };

    const winnerAfterPlayer = isGameOver(afterPlayerAttack);
    if (winnerAfterPlayer === "player") {
      setState({ ...afterPlayerAttack, winner: "player" });
      await delay(1200); // Wait for HP bar animation
      setCurrentMessage(`The wild ${state.enemy.name.toUpperCase()} fainted!`);
      if (onBattleEnd) onBattleEnd("player");
      return;
    }

    setState(afterPlayerAttack);
    await delay(1000); // Wait for HP bar to show progress before enemy turn starts
    const enemyMove = getRandomMove(state.enemy);

    setState((s) => ({ ...s, turn: "enemy" }));
    setCurrentMessage(`Wild ${state.enemy.name.toUpperCase()} used ${enemyMove.name.toUpperCase()}!`);
    await delay(1500);

    setState((s) => ({ ...s, attackingSide: "enemy" }));
    await delay(400);
    setState((s) => ({ ...s, hitSide: "player", attackingSide: null }));

    const newPlayerHp = dealDamage(
      state.player.hp,
      enemyMove,
      state.player.type,
    );
    const afterEnemyAttack: BattleState = {
      ...afterPlayerAttack,
      player: { ...state.player, hp: newPlayerHp },
      turn: "player",
      hitSide: null,
      attackingSide: null,
    };

    const winnerAfterEnemy = isGameOver(afterEnemyAttack);
    if (winnerAfterEnemy) {
        setState({ ...afterEnemyAttack, winner: winnerAfterEnemy });
        if (winnerAfterEnemy === 'enemy') {
            setCurrentMessage(`${state.player.name.toUpperCase()} fainted!`);
        } else {
            setCurrentMessage(`The wild ${state.enemy.name.toUpperCase()} fainted!`);
        }
        if (onBattleEnd) onBattleEnd(winnerAfterEnemy);
    } else {
        setState(afterEnemyAttack);
        setCurrentMessage(null); // Clear message to show buttons again
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
        {/* Enemy */}
        <PokemonCard
          pokemon={state.enemy}
          isAttacking={state.attackingSide === "enemy"}
          isHit={state.hitSide === "enemy"}
        />

        {/* Spacing between cards */}
        <View style={{ height: 100 }} />

        {/* Player */}
        <PokemonCard
          pokemon={state.player}
          isBack={true}
          isAttacking={state.attackingSide === "player"}
          isHit={state.hitSide === "player"}
        />
      </View>

      {/* Battle Actions Menu */}
      <BattleActions
        moves={state.player.moves}
        enemyTypes={state.enemy.type}
        onMovePress={attack}
        onBagPress={onBagPress}
        onRun={onRun}
        disabled={!!state.attackingSide || !!state.winner || !!currentMessage}
        currentLog={currentMessage}
      />
    </View>
  );
}

// ─── BattleScreen (route wrapper + swap modal) ────────────────────────────────

export default function BattleScreen({ route, navigation }: BattleScreenProps) {
  const { player, enemy, onRun } = route.params;
  const catchResult = route.params.catchResult;
  const onSave = (route.params as any).onSave;

  const { user } = useAuth();

  // Simple list for the swap modal
  const [teamMembers, setTeamMembers] = useState<TeamMemberForSwap[]>([]);

  // Only the Supabase id of the newly caught Pokémon is needed for the swap
  const [pendingCaughtId, setPendingCaughtId] = useState<string | null>(null);

  const [swapModalVisible, setSwapModalVisible] = useState(false);

  // ── React to catchResult coming back from InventoryBagScreen ──
  useEffect(() => {
    if (!catchResult?.caught) return;

    if (catchResult.teamFull) {
      loadTeamForSwap(catchResult.caughtPokemon.id);
    }

    // Clear the param so catching again later re-triggers this effect cleanly
    navigation.setParams({ catchResult: undefined });
  }, [catchResult]);

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

  const handleSwap = async (replacedId: string) => {
    if (!pendingCaughtId) return;
    try {
      await swapIntoTeam(pendingCaughtId, replacedId);
      setSwapModalVisible(false);
      setPendingCaughtId(null);
      if (onSave) onSave(); // Trigger refetch on dashboard
    } catch (e) {
      Alert.alert("Error", "Swap failed. Try again.");
    }
  };

  const handleDismissSwap = () => {
    // Player chose to keep their current team — newly caught goes to box
    setSwapModalVisible(false);
    setPendingCaughtId(null);
  };

  return (
    <>
      <Battle
        player={player}
        enemy={enemy}
        onBattleEnd={() => setTimeout(() => navigation.goBack(), 2000)}
        onRun={onRun}
        onBagPress={() =>
          navigation.navigate("InventoryBag", {
            pokemon: enemy,
            onCatchResult: (result) => {
              navigation.setParams({ catchResult: result });
            },
          })
        }
      />

      {/* Swap Modal — shown when team is full after a catch */}
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
    </>
  );
}
