import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pokemon } from "../../types/pokemon";
import { ABILITIES } from "../../data/pokemon/abilities/abilities";
import { MOVES } from "../../data/pokemon/moves/moves";

interface OpponentInfoModalProps {
  visible: boolean;
  pokemon: Pokemon | null;
  onClose: () => void;
}

export function OpponentInfoModal({ visible, pokemon, onClose }: OpponentInfoModalProps) {
  if (!pokemon) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{pokemon.name.toUpperCase()}</Text>
          
          <Text style={styles.sectionTitle}>Ability</Text>
          <View style={styles.abilityBox}>
            <Text style={styles.abilityName}>{pokemon.ability || "None"}</Text>
            <Text style={styles.abilityDesc}>
              {pokemon.ability ? ABILITIES[pokemon.ability.toLowerCase()]?.flavorText : "No ability info."}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Learned Moves</Text>
          <ScrollView style={styles.movesList}>
            {pokemon.moves.map((move, i) => {
              const details = MOVES[move.name.toLowerCase()];
              return (
                <View key={i} style={styles.moveRow}>
                  <Text style={styles.moveName}>{move.name}</Text>
                  <Text style={styles.moveDetail}>PWR: {details?.power || "-"}</Text>
                  <Text style={styles.moveDetail}>
                    {details?.damageClass === "physical" ? "⚔️" : details?.damageClass === "special" ? "✨" : "🛡️"}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

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
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
    maxHeight: "80%",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    color: "#fe6060",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  abilityBox: {
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  abilityName: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  abilityDesc: {
    color: "#9CA3AF",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 4,
  },
  movesList: {
    flexGrow: 0,
  },
  moveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  moveName: {
    color: "white",
    flex: 2,
    textTransform: "capitalize",
  },
  moveDetail: {
    color: "#9CA3AF",
    flex: 1,
    textAlign: "right",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
