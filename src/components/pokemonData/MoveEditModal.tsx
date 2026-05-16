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
import { BATTLE_MOVES } from "../../data/pokemon/moves/movesBattle";
import { SPECIES } from "../../data/pokemon/species/species";
import { colors } from "../../theme/color";
import { Move, Pokemon } from "../../types/pokemon";
import { TypeBadge } from "../TypeBadge";

interface Props {
  visible: boolean;
  onClose: () => void;
  pokemon: Pokemon;
  onConfirm: (newMoves: Move[], replacedMoveId?: string) => void;
}

export const MoveEditModal: React.FC<Props> = ({
  visible,
  onClose,
  pokemon,
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<"relearn" | "edit">("relearn");
  const [relearnStep, setRelearnStep] = useState<1 | 2>(1);
  const [manageStep, setManageStep] = useState<"list" | "add">("list");
  const [selectedNewMove, setSelectedNewMove] = useState<Move | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Move[]>([]);

  useEffect(() => {
    if (visible) {
      setRelearnStep(1);
      setManageStep("list");
      setSelectedNewMove(null);

      const speciesData = SPECIES[pokemon.speciesId];
      if (!speciesData) return;

      const normalize = (s: string) => s.toLowerCase().replace(/[\s]/g, "-");
      const currentMoveNames = pokemon.moves.map((m) => normalize(m.name));

      const learnable = speciesData.rawMoves
        .filter((m) => m.levelLearned <= pokemon.level)
        .filter((m) => !currentMoveNames.includes(normalize(m.name)))
        .map((m) => {
          const slug = normalize(m.name);
          const battleData = BATTLE_MOVES[slug];
          if (!battleData || battleData.category === "unique") return null;

          return {
            name: battleData.name,
            power: battleData.power || 0,
            pp: battleData.pp || 0,
            maxPp: battleData.pp || 0,
            type: battleData.type,
            accuracy: battleData.accuracy,
            damageClass: battleData.damageClass,
            description: battleData.description,
            effects: battleData.effects,
            priority: battleData.priority,
          } as Move;
        })
        .filter((m): m is Move => m !== null);

      const uniqueLearnable = Array.from(
        new Map(learnable.map((m) => [m.name.toLowerCase(), m])).values(),
      );
      setAvailableMoves(uniqueLearnable);
    }
  }, [visible, pokemon]);

  const handleSelectRelearnMove = (move: Move) => {
    setSelectedNewMove(move);
    setRelearnStep(2);
  };

  const handleConfirmRelearn = (index: number) => {
    if (!selectedNewMove) return;
    const newMoves = [...pokemon.moves];
    const replacedMoveId = newMoves[index].id;
    newMoves[index] = selectedNewMove;
    onConfirm(newMoves, replacedMoveId);
  };

  const handleRemoveMove = (index: number) => {
    if (pokemon.moves.length <= 1) return;
    const moveToRemoveId = pokemon.moves[index].id;
    const newMoves = pokemon.moves.filter((_, i) => i !== index);
    onConfirm(newMoves, moveToRemoveId);
  };

  const handleAddMove = (move: Move) => {
    if (pokemon.moves.length >= 4) return;
    const newMoves = [...pokemon.moves, move];
    onConfirm(newMoves);
  };

  const renderMoveItem = (move: Move, onPress: () => void) => (
    <TouchableOpacity style={styles.moveItem} onPress={onPress}>
      <View style={styles.moveHeader}>
        <Text style={styles.moveName}>{move.name.toUpperCase()}</Text>
        <TypeBadge type={move.type || "normal"} size="small" />
      </View>
      <View style={styles.moveStats}>
        <Text style={styles.moveDetailText}>PWR: {move.power || "-"}</Text>
        <Text style={styles.moveDetailText}>
          ACC: {move.accuracy ? `${move.accuracy}%` : "-"}
        </Text>
        <Text style={styles.moveDetailText}>PP: {move.pp}</Text>
      </View>
      {move.description && (
        <Text style={styles.moveDescription} numberOfLines={2}>
          {move.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.modalTitle}>Manage Moves</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "relearn" && styles.activeTab]}
              onPress={() => {
                setActiveTab("relearn");
                setRelearnStep(1);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "relearn" && styles.activeTabText,
                ]}
              >
                Relearn
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "edit" && styles.activeTab]}
              onPress={() => {
                setActiveTab("edit");
                setManageStep("list");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "edit" && styles.activeTabText,
                ]}
              >
                Manage
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentArea}>
            {activeTab === "relearn" ? (
              relearnStep === 1 ? (
                <>
                  <Text style={styles.instruction}>
                    Select a move to learn:
                  </Text>
                  <ScrollView style={styles.scroll}>
                    {availableMoves.length > 0 ? (
                      availableMoves.map((move, i) => (
                        <View key={i}>
                          {renderMoveItem(move, () =>
                            handleSelectRelearnMove(move),
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        No available moves at this level.
                      </Text>
                    )}
                  </ScrollView>
                </>
              ) : (
                <>
                  <Text style={styles.instruction}>
                    Replace move with {selectedNewMove?.name}:
                  </Text>
                  <ScrollView style={styles.scroll}>
                    {pokemon.moves.map((move, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.moveItem}
                        onPress={() => handleConfirmRelearn(i)}
                      >
                        <View style={styles.moveHeader}>
                          <Text style={styles.moveName}>
                            {move.name.toUpperCase()}
                          </Text>
                          <TypeBadge
                            type={move.type || "normal"}
                            size="small"
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setRelearnStep(1)}
                  >
                    <Text style={styles.backButtonText}>Back to List</Text>
                  </TouchableOpacity>
                </>
              )
            ) : manageStep === "list" ? (
              <>
                <Text style={styles.instruction}>
                  Current Moves ({pokemon.moves.length}/4):
                </Text>
                <ScrollView style={styles.scroll}>
                  {pokemon.moves.map((move, i) => (
                    <View key={i} style={styles.editMoveItem}>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Text style={styles.moveName}>
                            {move.name.toUpperCase()}
                          </Text>
                          <TypeBadge
                            type={move.type || "normal"}
                            size="small"
                          />
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.removeButton,
                          pokemon.moves.length <= 1 && { opacity: 0.5 },
                        ]}
                        onPress={() => handleRemoveMove(i)}
                        disabled={pokemon.moves.length <= 1}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={20}
                          color="white"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                {pokemon.moves.length < 4 && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setManageStep("add")}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={20}
                      color="white"
                    />
                    <Text style={styles.addButtonText}>Add New Move</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={styles.instruction}>Select a move to add:</Text>
                <ScrollView style={styles.scroll}>
                  {availableMoves.length > 0 ? (
                    availableMoves.map((move, i) => (
                      <View key={i}>
                        {renderMoveItem(move, () => handleAddMove(move))}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>
                      No available moves to add.
                    </Text>
                  )}
                </ScrollView>
              </>
            )}
          </View>

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
    borderRadius: 24,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  modalTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: colors.modalContent,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: "#9CA3AF",
    fontWeight: "bold",
  },
  activeTabText: {
    color: "white",
  },
  contentArea: {
    minHeight: 200,
  },
  scroll: {
    maxHeight: 350,
    marginBottom: 10,
  },
  moveItem: {
    backgroundColor: colors.modalContent,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.modalBorder,
  },
  editMoveItem: {
    backgroundColor: colors.modalContent,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.modalBorder,
  },
  moveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  moveName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  moveStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  moveDetailText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "600",
  },
  moveDescription: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 16,
  },
  instruction: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  emptyText: {
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 20,
    fontStyle: "italic",
  },
  backButton: {
    padding: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: colors.accent,
    fontWeight: "bold",
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: "#7F1D1D",
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#374151",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
