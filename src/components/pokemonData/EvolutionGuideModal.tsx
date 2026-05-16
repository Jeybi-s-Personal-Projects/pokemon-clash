import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EVOLUTIONS } from "../../data/pokemon/evolutions/evolutions";
import { colors } from "../../theme/color";

interface Props {
  visible: boolean;
  onClose: () => void;
  speciesId: number;
}

export const EvolutionGuideModal: React.FC<Props> = ({
  visible,
  onClose,
  speciesId,
}) => {
  const evolutionChain = useMemo(() => {
    // 1. Find the root speciesId
    let rootId = speciesId;
    let foundRoot = false;
    while (!foundRoot) {
      const prevStep = EVOLUTIONS.find((e) => e.toId === rootId);
      if (prevStep) {
        rootId = prevStep.fromId;
      } else {
        foundRoot = true;
      }
    }

    // 2. Build the tree/list
    // Note: This handle linear chains and some branching (like Eevee)
    const stages: {
      level: number;
      species: { id: number; name: string; requirements?: string }[];
    }[] = [];

    // Stage 0: Root
    stages.push({
      level: 0,
      species: [{ id: rootId, name: getSpeciesName(rootId) }],
    });

    // Stage 1: Evolutions from Root
    const stage1Steps = EVOLUTIONS.filter((e) => e.fromId === rootId);
    if (stage1Steps.length > 0) {
      stages.push({
        level: 1,
        species: stage1Steps.map((s) => ({
          id: s.toId,
          name: s.toName,
          requirements: formatRequirement(s.condition),
        })),
      });

      // Stage 2: Evolutions from Stage 1
      const stage2Species: {
        id: number;
        name: string;
        requirements?: string;
      }[] = [];
      stage1Steps.forEach((s1) => {
        const nextSteps = EVOLUTIONS.filter((e) => e.fromId === s1.toId);
        nextSteps.forEach((s2) => {
          stage2Species.push({
            id: s2.toId,
            name: s2.toName,
            requirements: formatRequirement(s2.condition),
          });
        });
      });

      if (stage2Species.length > 0) {
        stages.push({ level: 2, species: stage2Species });
      }
    }

    return stages;
  }, [speciesId]);

  function getSpeciesName(id: number) {
    const step = EVOLUTIONS.find((e) => e.fromId === id || e.toId === id);
    if (step) {
      return step.fromId === id ? step.fromName : step.toName;
    }
    return "Unknown";
  }

  function formatRequirement(condition: any) {
    switch (condition.trigger) {
      case "level-up":
        return `Level ${condition.level}`;
      case "use-item":
        return condition.item.replace(/-/g, " ").toUpperCase();
      case "trade":
        return condition.heldItem
          ? `Trade holding ${condition.heldItem.replace(/-/g, " ").toUpperCase()}`
          : "Trade";
      case "happiness":
        return condition.timeOfDay
          ? `Happiness (${condition.timeOfDay})`
          : "Happiness";
      case "other":
        return condition.note;
      default:
        return "Special Condition";
    }
  }

  const getImageUrl = (id: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Evolution Guide</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {evolutionChain.map((stage, idx) => (
              <View key={idx} style={styles.stageContainer}>
                {idx > 0 && (
                  <View style={styles.arrowContainer}>
                    <MaterialCommunityIcons
                      name="chevron-double-down"
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                )}

                <View style={styles.speciesRow}>
                  {stage.species.map((sp) => (
                    <View
                      key={sp.id}
                      style={[
                        styles.speciesCard,
                        sp.id === speciesId && styles.activeCard,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="pokeball"
                        size={120}
                        color="white"
                        style={styles.background}
                      />
                      <Image
                        source={{ uri: getImageUrl(sp.id) }}
                        style={styles.sprite}
                      />
                      <View style={styles.pokemonDetails}>
                        <Text style={styles.speciesName}>
                          {sp.name.toUpperCase()}
                        </Text>
                        {sp.requirements && (
                          <View style={styles.requirementBadge}>
                            <Text style={styles.requirementText}>
                              {sp.requirements}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>GOT IT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    backgroundColor: colors.modalBackgroundPrimary,
    borderRadius: 24,
    padding: 20,
    maxHeight: "85%",
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
  scrollContent: {
    paddingBottom: 20,
  },
  stageContainer: {
    alignItems: "center",
  },
  arrowContainer: {
    marginVertical: 10,
  },
  speciesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
  },
  speciesCard: {
    backgroundColor: colors.modalContent,
    borderRadius: 16,
    alignItems: "center",
    width: 180,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  activeCard: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + "15",
  },
  sprite: {
    width: 100,
    height: 100,
    marginBottom: 8,
    resizeMode: "contain",
  },
  background: {
    position: "absolute",
    opacity: 0.1,
  },
  pokemonDetails: {
    padding: 10,
    width: "100%",
    backgroundColor: colors.modalBackground,
    borderBottomEndRadius: 16,
    borderBottomStartRadius: 16,
    borderTopWidth: 1,
    borderTopColor: colors.modalBorderSubtle,
  },
  speciesName: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  requirementBadge: {
    backgroundColor: colors.bgTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  requirementText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
