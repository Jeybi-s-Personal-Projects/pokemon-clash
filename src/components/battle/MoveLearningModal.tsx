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
import { Move, Pokemon } from "../../types/pokemon";

// Use same type color map
const TYPE_COLORS: Record<string, string> = {
  fire: "#FF6B35",
  water: "#4FC3F7",
  grass: "#66BB6A",
  electric: "#FFD54F",
  psychic: "#F48FB1",
  ice: "#80DEEA",
  dragon: "#7986CB",
  dark: "#616161",
  fairy: "#F06292",
  normal: "#BDBDBD",
  fighting: "#EF5350",
  flying: "#90CAF9",
  poison: "#AB47BC",
  ground: "#D4A574",
  rock: "#8D6E63",
  bug: "#AED581",
  ghost: "#7E57C2",
  steel: "#78909C",
};

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

  // Reset lock whenever the modal becomes visible for a new move
  useEffect(() => {
    if (visible) {
      setIsProcessing(false);
    }
  }, [visible]);

  if (!newMove) return null;

  const handleSelect = (index: number | "skip") => {
    if (isProcessing) return;
    setIsProcessing(true);
    onSelect(index);
  };

  const newMoveDetails = MOVES[newMove.name.toLowerCase()];
  const newMoveType = newMove.type || "normal";
  const newMoveColor = TYPE_COLORS[newMoveType] ?? "#888";

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

          <View style={[styles.newMoveCard, { borderColor: newMoveColor }]}>
            <View style={styles.moveHeader}>
              <Text style={styles.newMoveName}>
                {newMove.name.toUpperCase()}
              </Text>
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

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelect(index)}
                  disabled={isProcessing}
                  style={[styles.moveButton, { borderColor: typeColor }]}
                >
                  <View style={styles.moveHeader}>
                    <Text style={styles.moveName}>
                      {move.name.toUpperCase()}
                    </Text>
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
});
