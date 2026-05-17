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
import { MovesetViewModal } from "../components/MovesetViewModal";
import { EvolutionGuideModal } from "../components/pokemonData/EvolutionGuideModal";
import { MoveEditModal } from "../components/pokemonData/MoveEditModal";
import StatusModal from "../components/statusModal";

import * as Crypto from "expo-crypto";
import { TYPE_COLORS, TypeBadge } from "../components/TypeBadge";
import db from "../lib/db";

import { ItemEquipModal } from "@/src/components/ItemEquipModal";
import { getItem } from "@/src/data/items/items";
import { ABILITIES } from "@/src/data/pokemon/abilities/abilities";
import { gen1Pokemon } from "../data/gen1Pokemon";
import { gen2Pokemon } from "../data/gen2Pokemon";
import { MOVES } from "../data/pokemon/moves/moves";
import { SPECIES } from "../data/pokemon/species/species";
import { PokemonStatsScreenProps } from "../types/navigation";
import { calculateHp, calculateStat } from "../utils/statCalculator";

const ALL_LOCAL = [...gen1Pokemon, ...gen2Pokemon];

const clickSound = require("../../assets/sounds/buttonClick.mp3");

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
  const [modalVisible, setModalVisible] = useState(false);
  const [moveEditVisible, setMoveEditVisible] = useState(false);
  const [evolutionVisible, setEvolutionVisible] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  const handleMoveUpdate = async (newMoves: any[], replacedMoveId?: string) => {
    playClick();
    setMoveEditVisible(false);

    try {
      const isRemoval = newMoves.length < pokemonState.moves.length;
      const isAddition = newMoves.length > pokemonState.moves.length;
      const isReplacement =
        newMoves.length === pokemonState.moves.length && replacedMoveId;

      if (isRemoval) {
        if (!replacedMoveId)
          throw new Error("No move ID provided for removal.");
        db.runSync(`DELETE FROM pokemon_moves WHERE id = ?`, [replacedMoveId]);
      } else if (isAddition || isReplacement) {
        const updatedMove =
          newMoves.find(
            (m: any) => !pokemonState.moves.find((om: any) => om.id === m.id),
          ) || newMoves.find((m: any) => !m.id);

        if (!updatedMove) throw new Error("No new move detected.");

        if (isReplacement) {
          db.runSync(
            `UPDATE pokemon_moves SET 
              move_name = ?, move_power = ?, move_pp = ?, move_max_pp = ?, move_type = ?,
              move_damageClass = ?, move_accuracy = ?, move_statChanges = ?,
              move_description = ?, move_priority = ?
            WHERE id = ?`,
            [
              updatedMove.name,
              updatedMove.power,
              updatedMove.pp,
              updatedMove.maxPp || updatedMove.pp,
              updatedMove.type ?? "normal",
              updatedMove.damageClass,
              updatedMove.accuracy,
              JSON.stringify(updatedMove.statChanges || []),
              updatedMove.description,
              updatedMove.priority,
              replacedMoveId,
            ],
          );
        } else {
          // Addition
          db.runSync(
            `INSERT INTO pokemon_moves (
              id, pokemon_id, move_name, move_power, move_pp, move_max_pp,
              move_type, move_damageClass, move_accuracy, 
              move_statChanges, move_description, move_priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              Crypto.randomUUID(),
              pokemonState.id,
              updatedMove.name,
              updatedMove.power,
              updatedMove.pp,
              updatedMove.maxPp || updatedMove.pp,
              updatedMove.type ?? "normal",
              updatedMove.damageClass,
              updatedMove.accuracy,
              JSON.stringify(updatedMove.statChanges || []),
              updatedMove.description,
              updatedMove.priority,
            ],
          );
        }
      }

      // Fetch fresh moves from local DB
      const moveRows = db.getAllSync<any>(
        `SELECT * FROM pokemon_moves WHERE pokemon_id = ?`,
        [pokemonState.id],
      );

      const finalMoves = moveRows.map((m) => {
        const slug = m.move_name.toLowerCase().replace(/[\s]/g, "-");
        const detail = MOVES[slug] || {};
        return {
          id: m.id,
          name: m.move_name,
          power: m.move_power,
          pp: m.move_pp,
          maxPp: m.move_max_pp || detail.pp || m.move_pp,
          type: m.move_type,
          damageClass: m.move_damageClass,
          accuracy: m.move_accuracy,
          statChanges: m.move_statChanges ? JSON.parse(m.move_statChanges) : [],
          description: m.move_description,
          priority: m.move_priority,
        };
      });

      const updatedPokemon = { ...pokemonState, moves: finalMoves };
      setPokemon(updatedPokemon);
      navigation.setParams({ pokemon: updatedPokemon });

      setStatusMessage("Moveset updated successfully!");
      setStatusType("success");
      setStatusVisible(true);
    } catch (error: any) {
      console.error("Move update error:", error);
      setStatusMessage(error.message);
      setStatusType("error");
      setStatusVisible(true);
    }
  };

  const handleEquipItem = async (itemId: string | null) => {
    playClick();
    setItemModalVisible(false);

    try {
      db.runSync(`UPDATE pokemon SET pk_held_item = ? WHERE id = ?`, [
        itemId,
        pokemonState.id,
      ]);

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

    try {
      db.runSync(`DELETE FROM pokemon WHERE id = ?`, [pokemonState.id]);
      // Dependent moves should be deleted via ON DELETE CASCADE in schema,
      // but let's be explicit just in case.
      db.runSync(`DELETE FROM pokemon_moves WHERE pokemon_id = ?`, [
        pokemonState.id,
      ]);

      setStatusMessage(`${pokemonState.name} was released into the wild.`);
      setStatusType("success");
      setStatusVisible(true);
    } catch (error: any) {
      setStatusMessage(error.message);
      setStatusType("error");
      setStatusVisible(true);
    }
  };

  const handleFactoryReset = async () => {
    playClick();
    const speciesData = SPECIES[pokemonState.speciesId];
    const localData = ALL_LOCAL.find((p) => p.id === pokemonState.speciesId);

    if (!speciesData || !localData) {
      setStatusMessage("Could not find species data.");
      setStatusType("error");
      setStatusVisible(true);
      return;
    }

    const baseUrl =
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown";
    const speciesId = pokemonState.speciesId;
    const isShiny = pokemonState.isShiny;

    const frontImage = isShiny
      ? `${baseUrl}/shiny/${speciesId}.gif`
      : `${baseUrl}/${speciesId}.gif`;
    const backImage = isShiny
      ? `${baseUrl}/back/shiny/${speciesId}.gif`
      : `${baseUrl}/back/${speciesId}.gif`;

    const resetPokemon = {
      ...pokemonState,
      name: localData.name.charAt(0).toUpperCase() + localData.name.slice(1),
      type: localData.types,
      ability: speciesData.abilities[0], // Use first ability as default
      hp: calculateHp(speciesData.baseStats.hp, pokemonState.level),
      maxHp: calculateHp(speciesData.baseStats.hp, pokemonState.level),
      attack: calculateStat(speciesData.baseStats.attack, pokemonState.level),
      defense: calculateStat(speciesData.baseStats.defense, pokemonState.level),
      specialAttack: calculateStat(
        speciesData.baseStats.spAttack,
        pokemonState.level,
      ),
      specialDefense: calculateStat(
        speciesData.baseStats.spDefense,
        pokemonState.level,
      ),
      speed: calculateStat(speciesData.baseStats.speed, pokemonState.level),
      frontImage,
      backImage,
    };

    try {
      db.runSync(
        `UPDATE pokemon SET 
          pk_name = ?, pk_hp = ?, pk_max_hp = ?,
          pk_attack = ?, pk_defense = ?, pk_special_attack = ?,
          pk_special_defense = ?, pk_speed = ?, pk_types = ?,
          pk_ability = ?, pk_front_image = ?, pk_back_image = ?
        WHERE id = ?`,
        [
          resetPokemon.name,
          resetPokemon.hp,
          resetPokemon.maxHp,
          resetPokemon.attack,
          resetPokemon.defense,
          resetPokemon.specialAttack,
          resetPokemon.specialDefense,
          resetPokemon.speed,
          JSON.stringify(resetPokemon.type),
          resetPokemon.ability,
          resetPokemon.frontImage,
          resetPokemon.backImage,
          pokemonState.id,
        ],
      );

      // Reset moves to maximum of 4
      const currentMoves = db.getAllSync<any>(
        `SELECT id FROM pokemon_moves WHERE pokemon_id = ? ORDER BY id ASC`,
        [pokemonState.id],
      );

      if (currentMoves && currentMoves.length > 4) {
        const movesToDelete = currentMoves.slice(4).map((m) => m.id);
        for (const moveId of movesToDelete) {
          db.runSync(`DELETE FROM pokemon_moves WHERE id = ?`, [moveId]);
        }
      }

      // Fetch fresh moves
      const moveRows = db.getAllSync<any>(
        `SELECT * FROM pokemon_moves WHERE pokemon_id = ?`,
        [pokemonState.id],
      );
      const finalMoves = moveRows.map((m) => {
        const slug = m.move_name.toLowerCase().replace(/[\s]/g, "-");
        const detail = MOVES[slug] || {};
        return {
          id: m.id,
          name: m.move_name,
          power: m.move_power,
          pp: m.move_pp,
          maxPp: m.move_max_pp || detail.pp || m.move_pp,
          type: m.move_type,
          damageClass: m.move_damageClass,
          accuracy: m.move_accuracy,
          statChanges: m.move_statChanges ? JSON.parse(m.move_statChanges) : [],
          description: m.move_description,
          priority: m.move_priority,
        };
      });

      const fullyResetPokemon = { ...resetPokemon, moves: finalMoves };
      setPokemon(fullyResetPokemon);
      navigation.setParams({ pokemon: fullyResetPokemon });
      setStatusMessage(
        `${fullyResetPokemon.name} has been reset to base form.`,
      );
      setStatusType("success");
      setStatusVisible(true);
    } catch (e: any) {
      setStatusMessage("Failed to reset Pokémon: " + e.message);
      setStatusType("error");
      setStatusVisible(true);
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
                  <TypeBadge key={t} type={t} />
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
                <TouchableOpacity
                  style={styles.evolutionGuideButton}
                  onPress={() => setEvolutionVisible(true)}
                >
                  <MaterialCommunityIcons
                    name="book-open-variant"
                    size={14}
                    color="white"
                  />
                  <Text style={styles.evolutionGuideButtonText}>
                    Evolution Guide
                  </Text>
                </TouchableOpacity>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Moves</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={styles.smallMovesetButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.smallMovesetButtonText}>View All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallMovesetButton}
                onPress={() => setMoveEditVisible(true)}
              >
                <Text style={styles.smallMovesetButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.movesList}>
            {pokemonState.moves.map((move: any, index: number) => {
              const details = MOVES[move.name.toLowerCase()];
              const moveType = details?.type || move.type || "normal";

              return (
                <View key={index} style={styles.moveDetailCard}>
                  <View style={styles.moveHeader}>
                    <TypeBadge type={moveType} />
                    <Text style={styles.moveNameDetail}>{move.name}</Text>
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

        <MovesetViewModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          speciesId={pokemonState.speciesId}
          currentMoves={pokemonState.moves.map((m: any) => m.name)}
        />

        <MoveEditModal
          visible={moveEditVisible}
          onClose={() => setMoveEditVisible(false)}
          pokemon={pokemonState}
          onConfirm={handleMoveUpdate}
        />

        <EvolutionGuideModal
          visible={evolutionVisible}
          onClose={() => setEvolutionVisible(false)}
          speciesId={pokemonState.speciesId}
        />

        <View style={styles.section}>
          <View style={styles.itemContainer}>
            <Text style={styles.sectionTitle}>Item Held</Text>
            <View style={styles.itemBox}>
              <View style={styles.itemMainRow}>
                <View style={styles.itemActionColumn}>
                  {pokemonState.heldItem ? (
                    <Image
                      source={{
                        uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${pokemonState.heldItem}.png`,
                      }}
                      style={styles.itemImageLarge}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="bag-personal-outline"
                      size={40}
                      color="#4B5563"
                    />
                  )}
                  <TouchableOpacity
                    style={styles.equipButtonSmall}
                    onPress={() => setItemModalVisible(true)}
                  >
                    <MaterialCommunityIcons
                      name="swap-horizontal"
                      size={14}
                      color="white"
                    />
                    <Text style={styles.equipButtonTextSmall}>
                      {pokemonState.heldItem ? "CHANGE" : "CHOOSE"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.itemInfoColumn}>
                  <Text style={styles.itemHeldName}>
                    {pokemonState.heldItem
                      ? getItem(pokemonState.heldItem)?.name || "Unknown Item"
                      : "No Item Held"}
                  </Text>
                  <Text style={styles.itemHeldDescription}>
                    {pokemonState.heldItem
                      ? getItemDescription(pokemonState.heldItem)
                      : "Equip an item to boost your Pokémon's performance in battle."}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debugging</Text>
          <Text style={styles.abilityDescription}>
            Resets the pokemon to its base form including original stats. Use
            cases include: mega evolved pokemon, gigantamax form and dynamax
            form. This does not reset the level nor the experience of your
            pokemon. This offers a safe way to restore your corrupted pokemon.
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleFactoryReset}
          >
            <Text style={styles.resetButtonText}>Reset Pokémon</Text>
          </TouchableOpacity>
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
        speciesId={pokemonState.speciesId}
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
  scrollContent: { padding: 20, paddingBottom: 160 },
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
    borderColor: colors.modalBorderSubtle,
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
    borderTopColor: colors.modalBorderSubtle,
    borderBottomColor: colors.modalBorderSubtle,
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
    textAlign: "left",
  },
  abilityRow: { width: "100%", flexDirection: "row", gap: "5%" },
  abilityTitle: {
    textAlign: "left",
    color: colors.accent,
    fontSize: 16,
    fontWeight: "bold",
    borderBottomWidth: 1,
    paddingBottom: 5,
    borderColor: colors.modalBorderSubtle,
    marginBottom: 5,
  },
  abilityName: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: "600",
    textTransform: "capitalize",
    textAlign: "left",
    fontStyle: "italic",
  },
  abilityDescription: {
    color: "#D1D5DB",
    fontSize: 14,
    textAlign: "left",
    lineHeight: 20,
    fontStyle: "italic",
  },
  hiddenAbilityTag: {
    color: "#facc15",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 2,
    fontStyle: "italic",
  },
  evolutionGuideButton: {
    marginTop: 15,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  evolutionGuideButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  abilityContainer: {
    marginTop: 10,
    width: "100%",
    backgroundColor: colors.modalContent,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  itemContainer: { width: "100%" },
  itemBox: {
    backgroundColor: colors.modalContent,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },

  itemMainRow: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
  },
  itemActionColumn: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  itemInfoColumn: {
    borderLeftWidth: 1,
    paddingLeft: 12,
    borderColor: colors.modalBorderSubtle,
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  itemImageLarge: {
    width: 56,
    height: 56,
  },
  itemHeldName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  itemHeldDescription: {
    width: 150,
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  equipButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  equipButtonTextSmall: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: colors.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  resetButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  pokedexTitle: {
    textAlign: "left",
    color: colors.accent,
    fontSize: 16,
    fontWeight: "bold",
    borderBottomWidth: 1,
    paddingBottom: 5,
    borderColor: colors.modalBorderSubtle,
    marginBottom: 5,
  },
  flavorText: {
    color: "#D1D5DB",
    fontSize: 14,
    textAlign: "left",
    lineHeight: 20,
    fontStyle: "italic",
  },
  section: {
    backgroundColor: colors.modalBackgroundPrimary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
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
  smallMovesetButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  smallMovesetButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
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
  moveNameDetail: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
    flex: 1,
    marginLeft: 8,
  },
  moveClassContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
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
    width: 60,
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
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  backButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  releaseButton: {
    flex: 1,
    backgroundColor: "#7F1D1D",
    paddingVertical: 16,
    borderRadius: 10,
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
