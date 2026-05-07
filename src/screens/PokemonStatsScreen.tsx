import { colors } from "@/src/theme/color";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import StatusModal from "../components/statusModal";
import { supabase } from "../lib/supabase";

import { ItemEquipModal } from "@/src/components/ItemEquipModal";
import { getItem } from "@/src/data/items/items";
import { ABILITIES } from "@/src/data/pokemon/abilities/abilities";
import { MOVES } from "../data/pokemon/moves/moves";
import { SPECIES } from "../data/pokemon/species/species";
import { PokemonStatsScreenProps } from "../types/navigation";

const clickSound = require("../../assets/sounds/buttonClick.mp3");

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

export default function PokemonStatsScreen({
  route,
  navigation,
}: PokemonStatsScreenProps) {
  const { pokemon, onRelease } = route.params as any;
  const [pokemonState, setPokemon] = useState(pokemon);
  const primaryType = pokemonState.type[0];
  const accentColor = TYPE_COLORS[primaryType] ?? "#888";

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  const handleEquipItem = async (itemId: string | null) => {
    playClick();
    setItemModalVisible(false);

    try {
      const { error } = await supabase
        .from("pokemon")
        .update({ pk_held_item: itemId })
        .eq("id", pokemonState.id);

      if (error) throw error;

      // Updating local state to reflect change
      const updatedPokemon = { ...pokemonState, heldItem: itemId || undefined };
      setPokemon(updatedPokemon);
      navigation.setParams({ pokemon: updatedPokemon });

      setStatusMessage(itemId ? "Item equipped!" : "Item unequipped!");
      setStatusType("success");
      setStatusVisible(true);
    } catch (error: any) {
      setStatusMessage(error.message);
      setStatusType("error");
      setStatusVisible(true);
    }
  };

  const handleRelease = async () => {
    playClick();
    setConfirmVisible(false);
    setIsReleasing(true);

    try {
      const { error } = await supabase
        .from("pokemon")
        .delete()
        .eq("id", pokemonState.id);

      if (error) throw error;

      setStatusMessage(`${pokemonState.name} was released into the wild.`);
      setStatusType("success");
      setStatusVisible(true);
    } catch (error: any) {
      setStatusMessage(error.message);
      setStatusType("error");
      setStatusVisible(true);
    } finally {
      setIsReleasing(false);
    }
  };

  const getItemDescription = (itemId: string) => {
    const item = getItem(itemId);
    if (!item) return "";
    return (
      item.description ||
      (item.category as any).effect ||
      (item.category as any).description ||
      ""
    );
  };

  const StatRow = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statBarBg}>
        <View
          style={[
            styles.statBarFill,
            {
              width: `${Math.min((value / 255) * 100, 100)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.imageContainer,
            { borderColor: colors.modalBorderSubtle },
          ]}
        >
          <View style={[styles.glow, { backgroundColor: accentColor + "50" }]}>
            <MaterialCommunityIcons
              name="pokeball"
              size={280}
              color="white"
              style={{ opacity: 0.05 }}
            />
          </View>
          <Image
            source={{ uri: pokemonState.frontImage }}
            style={styles.sprite}
            resizeMode="contain"
          />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{pokemonState.name}</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.typeBadges}>
                {pokemonState.type.map((t: string) => (
                  <View
                    key={t}
                    style={[
                      styles.badge,
                      { backgroundColor: (TYPE_COLORS[t] ?? "#888") + "33" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: TYPE_COLORS[t] ?? "#888" },
                      ]}
                    >
                      {t}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.level}>Level {pokemonState.level}</Text>
          </View>

          {SPECIES[pokemonState.speciesId]?.flavor_text && (
            <View style={styles.flavorTextContainer}>
              <Text style={styles.pokedexTitle}>Pokedex Entry:</Text>
              <Text style={styles.flavorText}>
                {SPECIES[pokemonState.speciesId].flavor_text}
              </Text>
            </View>
          )}
          <View style={styles.abilityRow}>
            {pokemonState.ability ? (
              <View style={styles.abilityContainer}>
                <Text style={styles.abilityTitle}>Ability</Text>
                <Text style={styles.abilityName}>{pokemonState.ability}</Text>
                <Text style={styles.abilityDescription}>
                  {ABILITIES[pokemonState.ability?.toLowerCase()]?.flavorText ||
                    "No description available."}
                </Text>
                {SPECIES[pokemonState.speciesId]?.abilities &&
                  pokemonState.ability ===
                    SPECIES[pokemonState.speciesId].abilities[
                      SPECIES[pokemonState.speciesId].abilities.length - 1
                    ] &&
                  SPECIES[pokemonState.speciesId].abilities.length > 1 && (
                    <Text style={styles.hiddenAbilityTag}>(Hidden)</Text>
                  )}
              </View>
            ) : (
              <View style={styles.abilityContainer}>
                <Text style={styles.abilityTitle}>Ability</Text>
                <Text style={styles.abilityName}>None</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <StatRow label="HP" value={pokemonState.maxHp} color="#FF5959" />
          <StatRow
            label="Attack"
            value={pokemonState.attack || 0}
            color="#F08030"
          />
          <StatRow
            label="Defense"
            value={pokemonState.defense || 0}
            color="#F8D030"
          />
          <StatRow
            label="Sp. Atk"
            value={pokemonState.specialAttack || 0}
            color="#6890F0"
          />
          <StatRow
            label="Sp. Def"
            value={pokemonState.specialDefense || 0}
            color="#78C850"
          />
          <StatRow
            label="Speed"
            value={pokemonState.speed || 0}
            color="#F85888"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moves</Text>
          <View style={styles.movesList}>
            {pokemonState.moves.map((move: any, index: number) => {
              const details = MOVES[move.name.toLowerCase()];
              const moveType = details?.type || move.type || "normal";
              const typeColor = TYPE_COLORS[moveType] ?? "#888";

              return (
                <View key={index} style={styles.moveDetailCard}>
                  <View style={styles.moveHeader}>
                    <View
                      style={[
                        styles.moveTypeBadge,
                        { backgroundColor: typeColor },
                      ]}
                    >
                      <Text style={styles.moveTypeBadgeText}>{moveType}</Text>
                    </View>
                    <Text style={styles.moveNameDetail}>{move.name}</Text>
                    <Text style={styles.moveClassText}>
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
                    </Text>
                  </View>
                  <View style={styles.moveStatsRow}>
                    <Text style={styles.moveStatItem}>
                      Power:{" "}
                      <Text style={styles.whiteText}>
                        {details?.power || "-"}
                      </Text>
                    </Text>
                    <Text style={styles.moveStatItem}>
                      Accuracy:{" "}
                      <Text style={styles.whiteText}>
                        {details?.accuracy ? `${details.accuracy}%` : "-"}
                      </Text>
                    </Text>
                    <Text style={styles.moveStatItem}>
                      PP:{" "}
                      <Text style={styles.whiteText}>
                        {move.pp}/{move.maxPp}
                      </Text>
                    </Text>
                  </View>
                  {details?.description && (
                    <Text style={styles.moveDescription}>
                      {details.description.replace(
                        /\$effect_chance/g,
                        details.effectChance?.toString() || "",
                      )}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.itemContainer}>
            <Text style={styles.abilityTitle}>Item Held</Text>
            {pokemonState.heldItem ? (
              <View style={styles.itemBox}>
                <Text style={styles.abilityName}>
                  {getItem(pokemonState.heldItem)?.name || "Unknown Item"}
                </Text>
                <Text style={styles.abilityDescription}>
                  {getItemDescription(pokemonState.heldItem)}
                </Text>
                <TouchableOpacity
                  style={styles.equipButton}
                  onPress={() => setItemModalVisible(true)}
                >
                  <Text style={styles.equipButtonText}>Change Item</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.itemBox}>
                <Text style={styles.abilityName}>None</Text>
                <TouchableOpacity
                  style={styles.equipButton}
                  onPress={() => setItemModalVisible(true)}
                >
                  <Text style={styles.equipButtonText}>Choose Item</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              playClick();
              navigation.goBack();
            }}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.releaseButton}
            onPress={() => {
              playClick();
              setConfirmVisible(true);
            }}
          >
            <Text style={styles.releaseButtonText}>Release</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ItemEquipModal
        visible={itemModalVisible}
        onSelect={handleEquipItem}
        onClose={() => setItemModalVisible(false)}
      />

      <Modal transparent visible={confirmVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Release Pokemon?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to release your{" "}
              {pokemonState.name.toUpperCase()}? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  playClick();
                  setConfirmVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>No, Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleRelease}
              >
                <Text style={styles.confirmButtonText}>Yes, Release</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <StatusModal
        visible={statusVisible}
        message={statusMessage}
        type={statusType}
        onClose={() => {
          setStatusVisible(false);
          if (statusType === "success") {
            onRelease?.();
            navigation.goBack();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  scrollContent: { padding: 20, paddingBottom: 120 },
  imageContainer: {
    alignItems: "center",
    backgroundColor: colors.modalBackgroundPrimary,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    marginBottom: 20,
  },
  glow: {
    position: "absolute",
    width: 280,
    height: 180,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    top: 10,
    alignSelf: "center",
  },
  sprite: { width: 150, height: 150 },
  nameContainer: {
    marginTop: 30,
    height: 60,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: colors.borderSubtle,
    borderBottomColor: colors.borderSubtle,
  },
  name: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    textTransform: "capitalize",
  },
  badgeContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 60,
  },
  typeBadges: { flexDirection: "column", gap: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase" },
  level: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  flavorTextContainer: {
    marginTop: 10,
    backgroundColor: colors.modalContent,
    padding: 20,
    borderTopStartRadius: 20,
    borderBottomEndRadius: 20,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    textAlign: "center",
  },
  abilityRow: { width: "100%", flexDirection: "row", gap: "5%" },
  abilityTitle: {
    textAlign: "left",
    color: "#fe6060",
    fontSize: 16,
    fontWeight: "bold",
    borderBottomWidth: 1,
    paddingBottom: 5,
    borderColor: colors.modalBorderSubtle,
    marginBottom: 5,
  },
  abilityName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textTransform: "capitalize",
    textAlign: "center",
  },
  abilityDescription: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    fontStyle: "italic",
    paddingHorizontal: 5,
  },
  hiddenAbilityTag: {
    color: "#facc15",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 2,
    fontStyle: "italic",
  },
  abilityContainer: {
    marginTop: 10,
    width: "100%",
    backgroundColor: colors.modalContent,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  itemContainer: { marginTop: 20, width: "100%" },
  itemBox: {
    marginTop: 10,
    backgroundColor: colors.modalContent,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    alignItems: "center",
  },
  equipButton: {
    marginTop: 12,
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  equipButtonText: { color: "white", fontWeight: "bold", fontSize: 12 },
  pokedexTitle: {
    textAlign: "left",
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    borderBottomWidth: 1,
    paddingBottom: 10,
    borderColor: colors.modalBorderSubtle,
    marginBottom: 10,
  },
  flavorText: {
    color: "#D1D5DB",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
  section: {
    backgroundColor: colors.modalBackgroundPrimary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    paddingBottom: 8,
  },
  statRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  statLabel: { color: "#9CA3AF", width: 80, fontSize: 14, fontWeight: "600" },
  statBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  statBarFill: { height: "100%", borderRadius: 4 },
  statValue: {
    color: "white",
    width: 35,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
  movesList: { gap: 12 },
  moveDetailCard: {
    backgroundColor: colors.modalContent,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.modalBorder,
  },
  moveHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  moveTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
  },
  moveTypeBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
    textTransform: "uppercase",
  },
  moveNameDetail: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
    flex: 1,
  },
  moveClassText: { fontSize: 16 },
  moveStatsRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.modalBorderSubtle,
    flexDirection: "row",
    gap: 15,
    marginBottom: 8,
  },
  moveStatItem: { color: "#9CA3AF", fontSize: 12 },
  whiteText: { color: "white", fontWeight: "bold" },
  moveDescription: { color: "#9CA3AF", fontSize: 12, lineHeight: 18 },
  moveAttackTypeContainer: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 4,
  },
  moveAttackTypeText: { color: "white", fontSize: 8, fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#030712",
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    paddingBottom: 70,
  },
  footerButtons: { flexDirection: "row", gap: 12 },
  backButton: {
    flex: 1,
    backgroundColor: "#1F2937",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  backButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  releaseButton: {
    flex: 1,
    backgroundColor: "#7F1D1D",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#991B1B",
  },
  releaseButtonText: { color: "#FCA5A5", fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: colors.modalBackgroundPrimary,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.modalBorder,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    alignItems: "center",
  },
  cancelButtonText: { color: "white", fontWeight: "bold" },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignContent: "center",
    alignItems: "center",
  },
  confirmButtonText: { color: "white", fontWeight: "bold" },
});
