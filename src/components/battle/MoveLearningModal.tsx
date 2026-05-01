import React from "react";
import { Modal, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Move, Pokemon } from "../../types/pokemon";

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
  if (!newMove) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Learn a New Move?</Text>
          <Text style={styles.subtitle}>
            {pokemon.name.toUpperCase()} wants to learn {newMove.name.toUpperCase()}.
            Select a move to replace:
          </Text>

          {/* New Move Info */}
          <View style={styles.newMoveCard}>
            <View style={styles.newMoveHeader}>
              <Text style={styles.newMoveName}>{newMove.name.toUpperCase()}</Text>
              <Text style={styles.newMoveType}>{newMove.type?.toUpperCase()}</Text>
            </View>
            <View style={styles.newMoveStats}>
              <Text style={styles.statText}>PWR: {newMove.power || "-"}</Text>
              <Text style={styles.statText}>ACC: {newMove.accuracy || "-"}</Text>
              <Text style={styles.statText}>PP: {newMove.pp}</Text>
            </View>
            <Text style={styles.description}>
              {newMove.description || "No description available."}
            </Text>
          </View>

          {/* Current Moves */}
          <View style={styles.movesGrid}>
            {pokemon.moves.map((move, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => onSelect(index)}
                style={styles.moveButton}
              >
                <Text style={styles.moveName}>{move.name.toUpperCase()}</Text>
                <Text style={styles.moveType}>{move.type?.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => onSelect("skip")}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>
              STOP LEARNING {newMove.name.toUpperCase()}
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
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 20,
  },
  container: {
    backgroundColor: "#1F2937",
    borderRadius: 15,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#374151",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 20,
  },
  newMoveCard: {
    backgroundColor: "#374151",
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  newMoveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  newMoveName: {
    color: "#818cf8",
    fontWeight: "bold",
  },
  newMoveType: {
    color: "#9CA3AF",
  },
  newMoveStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  statText: {
    color: "white",
    fontSize: 12,
  },
  description: {
    color: "#D1D5DB",
    fontSize: 12,
    fontStyle: "italic",
  },
  movesGrid: {
    gap: 10,
  },
  moveButton: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4B5563",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moveName: {
    color: "white",
    fontWeight: "bold",
  },
  moveType: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  skipButton: {
    marginTop: 24,
    padding: 12,
    alignItems: "center",
  },
  skipText: {
    color: "#EF4444",
    fontWeight: "bold",
  },
});
