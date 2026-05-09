import { colors } from "@/src/theme/color";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MOVES } from "../../data/pokemon/moves/moves";
import { BATTLE_MOVES } from "../../data/pokemon/moves/movesBattle";
import { Move, Pokemon } from "../../types/pokemon";
import { TYPE_COLORS, TypeBadge } from "../TypeBadge";

interface MoveLearningModalProps {
  visible: boolean;
  pokemon: Pokemon;
  newMove: Move | null;
  onSelect: (index: number | "skip") => void;
}

export const MoveLearningModal = ({
  visible,
  pokemon,
  newMove,
  onSelect,
}: MoveLearningModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmUniqueVisible, setConfirmUniqueVisible] = useState(false);
  const [pendingMoveIndex, setPendingMoveIndex] = useState<
    number | "skip" | null
  >(null);

  // Reset lock whenever the modal becomes visible for a new move
  useEffect(() => {
    if (visible) {
      setIsProcessing(false);
      setConfirmUniqueVisible(false);
      setPendingMoveIndex(null);
    }
  }, [visible]);

  if (!newMove) return null;

  const handleSelect = (index: number | "skip") => {
    const isUnique =
      index !== "skip" &&
      BATTLE_MOVES[pokemon.moves[index].name.toLowerCase()]?.category ===
        "unique";

    if (isUnique) {
      setPendingMoveIndex(index);
      setConfirmUniqueVisible(true);
    } else {
      executeSelection(index);
    }
  };

  const executeSelection = (index: number | "skip") => {
    if (isProcessing) return;
    setIsProcessing(true);
    onSelect(index);
  };

  const newMoveDetails = MOVES[newMove.name.toLowerCase()];
  const newMoveType = newMove.type || "normal";
  const newMoveColor = TYPE_COLORS[newMoveType] ?? "#888";
  const isNewMoveUnique = BATTLE_MOVES[newMove.name.toLowerCase()]?.category === "unique";

  const renderMoveCategoryIcon = (damageClass: string | undefined) => {
    switch (damageClass) {
      case "physical":
        return (
          <View style={styles.moveClassContainer}>
            <Text style={styles.moveAttackTypeText}>Physical</Text>
            <MaterialCommunityIcons
              name="brightness-5"
              size={16}
              color="orange"
            />
          </View>
        );
      case "special":
        return (
          <View style={styles.moveClassContainer}>
            <Text style={styles.moveAttackTypeText}>Special</Text>
            <MaterialCommunityIcons name="radar" size={16} color="#d8a6f9" />
          </View>
        );
      default:
        return (
          <View style={styles.moveClassContainer}>
            <Text style={styles.moveAttackTypeText}>Status</Text>
            <MaterialCommunityIcons name="auto-mode" size={16} color="yellow" />
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.pokemonName}>{pokemon.name.toUpperCase()}</Text>
          <Text style={styles.title}>NEW MOVE LEARNED</Text>

          <View style={[styles.newMoveCard, { borderColor: newMoveColor, opacity: isNewMoveUnique ? 0.6 : 1 }]}>
            <View style={styles.moveHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={styles.newMoveName}>
                  {newMove.name.toUpperCase()}
                  {isNewMoveUnique && " (UNIQUE)"}
                </Text>
                <TypeBadge type={newMoveType} size="small" />
              </View>
              {renderMoveCategoryIcon(newMoveDetails?.damageClass)}
            </View>
            <View style={styles.moveStatsRow}>
              <Text style={styles.moveStat}>PWR: {newMove.power || "-"}</Text>
              <Text style={styles.moveStat}>
                ACC: {newMove.accuracy ? `${newMove.accuracy}%` : "-"}
              </Text>
              <Text style={styles.moveStat}>PP: {newMove.pp}</Text>
            </View>
            <Text style={styles.description}>{newMove.description}</Text>
          </View>

          <Text style={styles.subtitle}>Replace existing move:</Text>
          <ScrollView style={styles.movesList}>
            {pokemon.moves.map((move, index) => {
              const details = MOVES[move.name.toLowerCase()];
              const typeColor = TYPE_COLORS[move.type || "normal"] ?? "#888";
              const isUnique =
                BATTLE_MOVES[move.name.toLowerCase()]?.category === "unique";
              const isPpEmpty = (move.pp ?? 0) <= 0;

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelect(index)}
                  disabled={isProcessing || isPpEmpty}
                  style={[
                    styles.moveButton,
                    {
                      borderColor: typeColor,
                      opacity: isPpEmpty || isUnique ? 0.6 : 1,
                    },
                  ]}
                >
                  <View style={styles.moveHeader}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text style={styles.moveName}>
                        {move.name.toUpperCase()}
                        {isPpEmpty && " (EMPTY)"}
                        {isUnique && " (UNIQUE)"}
                      </Text>
                      <TypeBadge type={move.type || "normal"} size="small" />
                    </View>
                    {renderMoveCategoryIcon(details?.damageClass)}
                  </View>
                  <View style={styles.moveStatsRow}>
                    <Text style={styles.moveStat}>
                      PWR: {details?.power || "-"}
                    </Text>
                    <Text style={styles.moveStat}>
                      ACC: {details?.accuracy ? `${details.accuracy}%` : "-"}
                    </Text>
                  </View>
                  <Text style={styles.moveDesc}>
                    {details?.description?.replace(
                      /\$effect_chance/g,
                      details.effectChance?.toString() || "",
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={() => handleSelect("skip")}
            disabled={isProcessing}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>
              Don't learn {newMove.name.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirmation Modal for Unique Moves */}
      <Modal visible={confirmUniqueVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>WARNING</Text>
            <Text style={styles.description}>
              Are you sure you want to learn this move? This move does not have
              usable logic in battle yet.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.skipButton,
                  { backgroundColor: "#EF4444", flex: 1, marginRight: 5 },
                ]}
                onPress={() => {
                  setConfirmUniqueVisible(false);
                  setPendingMoveIndex(null);
                }}
              >
                <Text style={styles.skipText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.skipButton,
                  { backgroundColor: "#10B981", flex: 1, marginLeft: 5 },
                ]}
                onPress={() => {
                  setConfirmUniqueVisible(false);
                  if (pendingMoveIndex !== null)
                    executeSelection(pendingMoveIndex);
                }}
              >
                <Text style={styles.skipText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.modalOverlay,
    padding: 15,
  },
  container: {
    backgroundColor: colors.modalBackgroundPrimary,
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.modalBorderSubtle,
    maxHeight: "85%",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  pokemonName: {
    color: "#FBBF24",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#fe6060",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    textAlign: "center",
  },
  newMoveCard: {
    backgroundColor: colors.modalContent,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 5,
  },
  moveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  newMoveName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  moveStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  moveStat: {
    color: "#E2C96B",
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    color: "#9CA3AF",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  movesList: {
    flexGrow: 0,
  },
  moveButton: {
    backgroundColor: colors.modalContent,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  moveName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  moveAttackTypeText: {
    color: "#9CA3AF",
    fontSize: 8,
    fontStyle: "italic",
  },
  moveClassContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  moveDesc: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  skipButton: {
    marginTop: 15,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#7F1D1D",
    borderRadius: 12,
  },
  skipText: {
    color: "white",
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
