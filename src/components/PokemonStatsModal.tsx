import { colors } from "@/src/theme/color";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Pokemon } from "../types/pokemon";

interface PokemonStatsModalProps {
  visible: boolean;
  pokemon: Pokemon | null;
  onClose: () => void;
}

export function PokemonStatsModal({
  visible,
  pokemon,
  onClose,
}: PokemonStatsModalProps) {
  if (!pokemon) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{pokemon.name.toUpperCase()}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>HP</Text>
              <Text style={styles.statValue}>{pokemon.hp}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Attack</Text>
              <Text style={styles.statValue}>{pokemon.attack}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Defense</Text>
              <Text style={styles.statValue}>{pokemon.defense}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Sp. Atk</Text>
              <Text style={styles.statValue}>{pokemon.specialAttack}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Sp. Def</Text>
              <Text style={styles.statValue}>{pokemon.specialDefense}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Speed</Text>
              <Text style={styles.statValue}>{pokemon.speed}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 15,
  },
  content: {
    backgroundColor: colors.modalBackground,
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.modalBorderSubtle,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  statsContainer: {
    backgroundColor: colors.modalContent,
    padding: 15,
    borderRadius: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "600",
  },
  statValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
