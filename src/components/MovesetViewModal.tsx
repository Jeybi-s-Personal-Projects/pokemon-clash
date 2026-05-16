import { TypeBadge } from "@/src/components/TypeBadge";
import { BATTLE_MOVES } from "@/src/data/pokemon/moves/movesBattle";
import { SPECIES } from "@/src/data/pokemon/species/species";
import { colors } from "@/src/theme/color";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchPokemon } from "../api/pokeApi";

interface Props {
  visible: boolean;
  onClose: () => void;
  speciesId: number;
  currentMoves: string[];
}

export const MovesetViewModal: React.FC<Props> = ({
  visible,
  onClose,
  speciesId,
  currentMoves,
}) => {
  const [speciesData, setSpeciesData] = useState(SPECIES[speciesId]);
  const [expandedMove, setExpandedMove] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSpeciesData(SPECIES[speciesId]);
      setError(null);
    }
  }, [speciesId, visible]);

  if (!speciesData) return null;

  const toggleExpand = (name: string) => {
    setExpandedMove(expandedMove === name ? null : name);
  };

  const syncWithPokeApi = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPokemon(speciesId.toString());
      const apiMoves = data.moves.map((m: any) => {
        const levelUpDetails = m.version_group_details.find(
          (vg: any) => vg.move_learn_method.name === "level-up",
        );
        return {
          name: m.move.name,
          levelLearned: levelUpDetails ? levelUpDetails.level_learned_at : 0,
        };
      });

      // Filter only level-up moves for consistency with local data, or include all?
      // User said "possible moves to be learned", let's include all from API but filter for levelUp for now
      // to match existing logic, or just show everything learned by level-up.

      const mergedMoves = [...speciesData.rawMoves];
      apiMoves.forEach((am: any) => {
        if (!mergedMoves.find((rm) => rm.name === am.name)) {
          mergedMoves.push(am);
        }
      });

      setSpeciesData({
        ...speciesData,
        rawMoves: mergedMoves,
      });
    } catch (err: any) {
      setError("Failed to sync moveset. Using local data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedCurrentMoves = currentMoves.map((m) =>
    m.toLowerCase().replace(/ /g, "-"),
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Potential Moveset</Text>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={syncWithPokeApi}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <View style={styles.syncContent}>
                  <MaterialCommunityIcons
                    name="sync"
                    size={14}
                    color={colors.accent}
                  />
                  <Text style={styles.syncText}>All Gen</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <ScrollView>
            {speciesData.rawMoves
              .sort((a, b) => a.levelLearned - b.levelLearned)
              .map((m, i) => {
                const moveKey = m.name.toLowerCase();
                const moveData = BATTLE_MOVES[moveKey];
                const isLearned = normalizedCurrentMoves.includes(moveKey);

                return (
                  <View key={i} style={styles.moveContainer}>
                    <TouchableOpacity
                      style={styles.moveHeader}
                      onPress={() => toggleExpand(m.name)}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                        }}
                      >
                        <Text
                          style={[
                            styles.moveName,
                            { color: isLearned ? colors.accent : "white" },
                          ]}
                        >
                          Lv.{m.levelLearned} -{" "}
                          {(
                            moveData?.name || m.name.replace(/-/g, " ")
                          ).toUpperCase()}
                        </Text>
                        {moveData && (
                          <TypeBadge type={moveData.type} size="small" />
                        )}
                      </View>
                      <MaterialCommunityIcons
                        name={
                          expandedMove === m.name
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={20}
                        color="white"
                      />
                    </TouchableOpacity>
                    {expandedMove === m.name && (
                      <View style={styles.descriptionContainer}>
                        <View style={styles.moveStatsRow}>
                          <View style={styles.statBadge}>
                            <Text style={styles.statLabel}>PWR</Text>
                            <Text style={styles.statValue}>
                              {moveData?.power || "-"}
                            </Text>
                          </View>
                          <View style={styles.statBadge}>
                            <Text style={styles.statLabel}>ACC</Text>
                            <Text style={styles.statValue}>
                              {moveData?.accuracy
                                ? `${moveData.accuracy}%`
                                : "-"}
                            </Text>
                          </View>
                          <View style={styles.statBadge}>
                            <Text style={styles.statLabel}>PP</Text>
                            <Text style={styles.statValue}>
                              {moveData?.pp || "-"}
                            </Text>
                          </View>
                          {moveData?.priority !== 0 && (
                            <View style={styles.statBadge}>
                              <Text style={styles.statLabel}>PRIO</Text>
                              <Text style={styles.statValue}>
                                {moveData?.priority > 0
                                  ? `+${moveData.priority}`
                                  : moveData?.priority}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.detailsRow}>
                          <View style={styles.classIndicator}>
                            {moveData?.damageClass === "physical" ? (
                              <MaterialCommunityIcons
                                name="brightness-5"
                                size={14}
                                color="orange"
                              />
                            ) : moveData?.damageClass === "special" ? (
                              <MaterialCommunityIcons
                                name="radar"
                                size={14}
                                color="#d8a6f9"
                              />
                            ) : (
                              <MaterialCommunityIcons
                                name="auto-mode"
                                size={14}
                                color="yellow"
                              />
                            )}
                            <Text style={styles.classText}>
                              {(
                                moveData?.damageClass || "status"
                              ).toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.description}>
                          {moveData?.description?.replace(
                            /\$effect_chance/g,
                            (moveData as any).effectChance?.toString() || "10",
                          ) || "No description available."}
                        </Text>
                      </View>
                    )}
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
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "center",
    padding: 20,
  },
  container: {
    backgroundColor: colors.modalBackgroundPrimary,
    padding: 20,
    borderRadius: 20,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  syncContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  syncText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.danger,
    fontSize: 10,
    textAlign: "center",
    marginBottom: 10,
  },
  moveContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: colors.modalContent,
    borderRadius: 8,
  },
  moveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  moveName: { fontSize: 13, fontWeight: "bold" },
  descriptionContainer: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 4,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.modalBorderSubtle,
  },
  moveStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  statBadge: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#374151",
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 8,
    fontWeight: "bold",
  },
  statValue: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  classIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#111827",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  classText: {
    color: "white",
    fontSize: 9,
    fontWeight: "900",
    fontStyle: "italic",
  },
  description: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: { color: "white", fontWeight: "bold" },
});
