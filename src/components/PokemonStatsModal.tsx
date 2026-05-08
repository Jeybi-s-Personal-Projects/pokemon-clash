import { colors } from "@/src/theme/color";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatStages } from "../battle/battleTypes";
import { ABILITIES } from "../data/pokemon/abilities/abilities";
import { Pokemon } from "../types/pokemon";

interface PokemonStatsModalProps {
  visible: boolean;
  pokemon: Pokemon | null;
  stages?: StatStages;
  onClose: () => void;
}

const calculateEffectiveStat = (base: number, stage: number) => {
  if (stage === 0) return base;
  const multipliers: Record<number, number> = {
    [-6]: 2 / 8,
    [-5]: 2 / 7,
    [-4]: 2 / 6,
    [-3]: 2 / 5,
    [-2]: 2 / 4,
    [-1]: 2 / 3,
    [0]: 1,
    [1]: 3 / 2,
    [2]: 4 / 2,
    [3]: 5 / 2,
    [4]: 6 / 2,
    [5]: 7 / 2,
    [6]: 8 / 2,
  };
  return Math.floor(base * (multipliers[stage] || 1));
};

export function PokemonStatsModal({
  visible,
  pokemon,
  stages = {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  },
  onClose,
}: PokemonStatsModalProps) {
  if (!pokemon) return null;

  const abilityDetails = pokemon.ability
    ? ABILITIES[pokemon.ability.toLowerCase()]
    : null;

  const renderStatRow = (
    label: string,
    value: number,
    stage: number,
    displayValue: number,
  ) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {stage !== 0 && (
          <Text
            style={[
              styles.multiplier,
              { color: stage > 0 ? "#4ADE80" : "#F87171" },
            ]}
          >
            {stage > 0 ? "+" : ""}
            {stage}
          </Text>
        )}
        <Text style={styles.statValue}>{displayValue}</Text>
      </View>
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{pokemon.name.toUpperCase()}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>HP</Text>
                <Text style={styles.statValue}>
                  {pokemon.hp} / {pokemon.maxHp}
                </Text>
              </View>
              {renderStatRow(
                "Attack",
                pokemon.attack,
                stages.attack,
                calculateEffectiveStat(pokemon.attack, stages.attack),
              )}
              {renderStatRow(
                "Defense",
                pokemon.defense,
                stages.defense,
                calculateEffectiveStat(pokemon.defense, stages.defense),
              )}
              {renderStatRow(
                "Sp. Atk",
                pokemon.specialAttack,
                stages.specialAttack,
                calculateEffectiveStat(
                  pokemon.specialAttack,
                  stages.specialAttack,
                ),
              )}
              {renderStatRow(
                "Sp. Def",
                pokemon.specialDefense,
                stages.specialDefense,
                calculateEffectiveStat(
                  pokemon.specialDefense,
                  stages.specialDefense,
                ),
              )}
              {renderStatRow(
                "Speed",
                pokemon.speed,
                stages.speed,
                calculateEffectiveStat(pokemon.speed, stages.speed),
              )}
            </View>

            <Text style={styles.sectionTitle}>Ability</Text>
            <View style={styles.abilityBox}>
              <Text style={styles.abilityName}>
                {pokemon.ability || "None"}
              </Text>
              <Text style={styles.abilityDesc}>
                {abilityDetails?.flavorText || "No ability info."}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: "85%",
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  sectionTitle: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textTransform: "uppercase",
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
    borderBottomColor: colors.modalBorderSubtle,
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "600",
  },
  multiplier: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
  },
  statValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  abilityBox: {
    backgroundColor: colors.modalContent,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  abilityName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  abilityDesc: {
    color: "#9CA3AF",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
  },
  closeButton: {
    marginTop: 25,
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
