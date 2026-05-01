import { useEffect } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";

import BattleActions from "../components/battleActions";
import EvolutionModal from "../components/evolutionModal";
import PokemonCard from "../components/pokemonCard";
import StatusModal from "../components/statusModal";

import { useBattle } from "../hooks/useBattle";
import { BattleScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";
import { getExpForLevel } from "../utils/experienceCalculator";

import { setAudioModeAsync } from "expo-audio";

// ─── Inner Battle component ──────────────────────────────────────────────────

interface BattleProps {
  player: Pokemon;
  team: Pokemon[];
  enemy: Pokemon;
  onBattleEnd?: (
    winner: "player" | "enemy",
    finalTeam: Pokemon[],
    didEvolve: boolean,
  ) => void;
  onRun?: (finalTeam: Pokemon[]) => void;
  onBagPress?: (player: Pokemon, team: Pokemon[], currentEnemy: Pokemon) => void;
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
  const battle = useBattle({
    player,
    team,
    enemy,
    onBattleEnd,
    onSave,
    catchPending,
    onToggleAutoBattle,
  });

  const { state, currentMessage } = battle;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

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
        onMovePress={battle.attack}
        onPokemonPress={() => battle.setSwitchModalVisible(true)}
        onBagPress={() => onBagPress?.(state.player, state.team, state.enemy)}
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
        visible={battle.statusVisible}
        message={battle.statusMessage}
        type="success"
        onClose={battle.handleStatusClose}
      />

      <EvolutionModal
        visible={battle.evolutionVisible}
        pokemon={battle.evolvingPokemon}
        onClose={() => {
          battle.setEvolutionVisible(false);
          battle.resolveEvolution?.resolve();
        }}
      />

      <Modal
        visible={battle.switchModalVisible}
        transparent
        animationType="slide"
      >
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
                    onPress={() => battle.handleSwitch(index)}
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
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 4,
                        }}
                      >
                        <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                          Lv. {item.level}
                        </Text>
                        <View
                          style={{
                            flex: 1,
                            height: 4,
                            backgroundColor: "#374151",
                            borderRadius: 2,
                          }}
                        >
                          <View
                            style={{
                              width: `${(item.hp / item.maxHp) * 100}%`,
                              height: "100%",
                              backgroundColor:
                                item.hp / item.maxHp > 0.5
                                  ? "#22c55e"
                                  : item.hp / item.maxHp > 0.2
                                    ? "#f59e0b"
                                    : "#ef4444",
                              borderRadius: 2,
                            }}
                          />
                        </View>
                        <Text style={{ color: "white", fontSize: 12 }}>
                          {Math.ceil(item.hp)}/{item.maxHp}
                        </Text>
                      </View>
                    </View>
                    {isFainted && (
                      <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                        FNT
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            {state.player.hp > 0 && (
              <TouchableOpacity
                onPress={() => battle.setSwitchModalVisible(false)}
                style={{
                  marginTop: 16,
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: "#9CA3AF" }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={battle.swapModalVisible}
        transparent
        animationType="slide"
      >
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
              data={battle.teamMembers}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => battle.handleSwap(item.id)}
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
              onPress={battle.handleDismissSwap}
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text style={{ color: "#9CA3AF" }}>Keep current team</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Move Learning Modal */}
      <Modal
        visible={battle.moveModalVisible}
        transparent
        animationType="slide"
      >
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
              {battle.pendingMove?.name.toUpperCase()}. Select a move to
              replace:
            </Text>

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
                  {battle.pendingMove?.name.toUpperCase()}
                </Text>
                <Text style={{ color: "#9CA3AF" }}>
                  {battle.pendingMove?.type?.toUpperCase()}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 4 }}>
                <Text style={{ color: "white", fontSize: 12 }}>
                  PWR: {battle.pendingMove?.power || "-"}
                </Text>
                <Text style={{ color: "white", fontSize: 12 }}>
                  ACC: {battle.pendingMove?.accuracy || "-"}
                </Text>
                <Text style={{ color: "white", fontSize: 12 }}>
                  PP: {battle.pendingMove?.pp}
                </Text>
              </View>
              <Text
                style={{ color: "#D1D5DB", fontSize: 12, fontStyle: "italic" }}
              >
                {battle.pendingMove?.description || "No description available."}
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {state.player.moves.map((move, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => battle.handleMoveSelection(index)}
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
              onPress={() => battle.handleMoveSelection("skip")}
              style={{ marginTop: 24, padding: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                STOP LEARNING {battle.pendingMove?.name.toUpperCase()}
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

  useEffect(() => {
    if (catchPending) {
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
      onBagPress={(p, t, e) =>
        navigation.navigate("InventoryBag", {
          player: p,
          team: t,
          pokemon: e,
          fromScreen: "Battle",
        } as any)
      }
      isAutoBattle={isAutoBattle}
      onToggleAutoBattle={onToggleAutoBattle}
    />
  );
}
