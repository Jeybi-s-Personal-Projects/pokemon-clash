import { colors } from "@/src/theme/color";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ABILITIES } from "../../data/pokemon/abilities/abilities";
import { MOVES } from "../../data/pokemon/moves/moves";
import { BATTLE_MOVES } from "../../data/pokemon/moves/movesBattle";
import { Pokemon } from "../../types/pokemon";
import { formatMoveDescription } from "../../utils/battleUtils";
import { TypeBadge, TYPE_COLORS } from "../TypeBadge";

interface OpponentInfoModalProps {
  visible: boolean;
  pokemon: Pokemon | null;
  onClose: () => void;
}

export function OpponentInfoModal({
  visible,
  pokemon,
  onClose,
}: OpponentInfoModalProps) {
  if (!pokemon) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{pokemon.name.toUpperCase()}</Text>
          <View style={styles.typeContainer}>
            {pokemon.type.map((t) => (
              <TypeBadge key={t} type={t} size="small" />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Ability</Text>
          <View style={styles.abilityBox}>
            <Text style={styles.abilityName}>{pokemon.ability || "None"}</Text>
            <Text style={styles.abilityDesc}>
              {pokemon.ability
                ? ABILITIES[pokemon.ability.toLowerCase()]?.flavorText
                : "No ability info."}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Learned Moves</Text>
          <ScrollView style={styles.movesList}>
            {pokemon.moves.map((move, i) => {
              const details = MOVES[move.name.toLowerCase()];
              const moveType = details?.type || move.type || "normal";
              const typeColor = TYPE_COLORS[moveType] ?? "#888";
              const moveBattleData = BATTLE_MOVES[move.name.toLowerCase()];
              const isDisabled =
                (move.pp ?? 0) <= 0 || moveBattleData?.category === "unique";

              return (
                <View
                  key={i}
                  style={[
                    styles.moveCard,
                    { borderColor: typeColor, opacity: isDisabled ? 0.6 : 1 },
                  ]}
                >
                  <View style={styles.moveHeader}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                      <Text style={styles.moveName}>
                        {move.name} {isDisabled && "(NO LOGIC YET)"}
                      </Text>
                      <TypeBadge type={moveType} size="small" />
                    </View>
                    <View style={styles.moveClassContainer}>
                      {details?.damageClass === "physical" ? (
                        <View style={styles.moveAttackTypeContainer}>
                          <MaterialCommunityIcons
                            name="brightness-5"
                            size={16}
                            color="orange"
                          />
                          <Text style={styles.moveAttackTypeText}>
                            Physical
                          </Text>
                        </View>
                      ) : details?.damageClass === "special" ? (
                        <View style={styles.moveAttackTypeContainer}>
                          <MaterialCommunityIcons
                            name="radar"
                            size={16}
                            color="#d8a6f9"
                          />
                          <Text style={styles.moveAttackTypeText}>Special</Text>
                        </View>
                      ) : (
                        <View style={styles.moveAttackTypeContainer}>
                          <MaterialCommunityIcons
                            name="auto-mode"
                            size={16}
                            color="yellow"
                          />
                          <Text style={styles.moveAttackTypeText}>Status</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.moveStatsRow}>
                    <Text style={styles.moveStat}>
                      PWR: {details?.power || "-"}
                    </Text>
                    <Text style={styles.moveStat}>
                      ACC: {details?.accuracy ? `${details.accuracy}%` : "-"}
                    </Text>
                    <Text style={styles.moveStat}>
                      PP: {move.pp}/{move.maxPp}
                    </Text>
                  </View>

                  <Text style={styles.moveDesc}>
                    {formatMoveDescription(
                      details?.description,
                      moveBattleData || details,
                    )}
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
    marginBottom: 10,
    letterSpacing: 1,
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 5,
    textTransform: "uppercase",
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
  movesList: {
    marginTop: 5,
  },
  moveCard: {
    backgroundColor: colors.modalContent,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  moveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  moveName: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  moveClassContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  moveAttackTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  moveAttackTypeText: {
    color: "#9CA3AF",
    fontSize: 8,
    fontStyle: "italic",
  },
  moveStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  moveStat: {
    color: "#E2C96B",
    fontSize: 11,
    fontWeight: "600",
  },
  moveDesc: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    marginTop: 15,
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
