import type { Area } from "@/src/encounter/batchGenerator";
import { colors } from "@/src/theme/color";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AreaSelectScreenProps } from "../types/navigation";
import { getPokemonIcon } from "../utils/pokemonImageUtils";

// Data imports for encounter info
import { gen1Pokemon } from "../data/gen1Pokemon";
import { gen2Pokemon } from "../data/gen2Pokemon";
import * as gen1Tables from "../encounter/gen1/tables";
import * as gen2Tables from "../encounter/gen2/tables";

const ALL_POKEMON_META = [...gen1Pokemon, ...gen2Pokemon];
const banner = require("@/assets/banners/banner-2.jpg");

// ─── Assets ───────────────────────────────────────────────────────────────────

const AREA_IMAGES: Record<string, any> = {
  plains: require("../../assets/areas/plains.jpg"),
  mountain: require("../../assets/areas/mountain.jpg"),
  water: require("../../assets/areas/water.jpg"),
  cave: require("../../assets/areas/cave.jpg"),
  urban: require("../../assets/areas/urban.jpg"),
  volcano: require("../../assets/areas/volcano.jpg"),
  training: require("../../assets/areas/training.jpg"),
  safari: require("../../assets/areas/safari.jpg"),
};

// ─── Types ────────────────────────────────────────────────────────────────────

type AreaConfig = {
  id: Area;
  label: string;
  description: string;
  encounterHint: string;
  accent: string;
  difficulty: "easy" | "medium" | "hard";
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const AREAS: AreaConfig[] = [
  {
    id: "plains",
    label: "Blooming Plains",
    description: "Sun-drenched meadows teeming with life.",
    encounterHint: "Normal, Grass, Bug",
    accent: "#5dc840",
    difficulty: "easy",
  },
  {
    id: "water",
    label: "Azure Coast",
    description: "The rhythmic crashing of waves hide secrets.",
    encounterHint: "Water, Ice",
    accent: "#2090e0",
    difficulty: "medium",
  },
  {
    id: "training",
    label: "Training Grounds",
    description: "A sanctuary for rare and gifted Pokémon.",
    encounterHint: "Starters, Babies",
    accent: "#10b981",
    difficulty: "medium",
  },
  {
    id: "safari",
    label: "Safari Zone",
    description: "The ultimate wilderness for true trackers.",
    encounterHint: "Rare & Versatile",
    accent: "#84cc16",
    difficulty: "medium",
  },
  {
    id: "mountain",
    label: "Peak of Titans",
    description: "Jagged cliffs where only the strong survive.",
    encounterHint: "Rock, Ground, Flying",
    accent: "#c8a440",
    difficulty: "hard",
  },
  {
    id: "cave",
    label: "Crystal Caverns",
    description: "Glowing gems illuminate the deep dark.",
    encounterHint: "Ghost, Steel, Fossil",
    accent: "#8060d0",
    difficulty: "hard",
  },
  {
    id: "urban",
    label: "Abandoned Lab",
    description: "Flickering lights and humming machinery.",
    encounterHint: "Electric, Steel, Psychic",
    accent: "#9aa4b2",
    difficulty: "hard",
  },
  {
    id: "volcano",
    label: "Magma Crater",
    description: "The air shimmers with intense heat.",
    encounterHint: "Fire, Fighting, Dark",
    accent: "#ef4444",
    difficulty: "hard",
  },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "#22c55e",
  medium: "#f59e0b",
  hard: "#ef4444",
};

// ─── Area card ────────────────────────────────────────────────────────────────

function AreaCard({
  area,
  flavorText,
  onEnter,
  onShowEncounters,
  isSelected,
}: {
  area: AreaConfig;
  flavorText?: string;
  onEnter: () => void;
  onShowEncounters: () => void;
  isSelected: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const image = AREA_IMAGES[area.id];

  function handlePressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View
      style={[
        styles.areaCard,
        { transform: [{ scale: scaleAnim }] },
        isSelected && { borderColor: area.accent, borderWidth: 2 },
      ]}
    >
      <ImageBackground source={image} style={StyleSheet.absoluteFill}>
        <View style={styles.gradientOverlay} />

        <View style={styles.cardTop}>
          <View
            style={[
              styles.diffBadge,
              { backgroundColor: DIFFICULTY_COLOR[area.difficulty] + "CC" },
            ]}
          >
            <Text style={styles.diffText}>{area.difficulty.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.cardInfo}>
            <Text style={styles.areaLabel}>{area.label}</Text>
            <Text style={styles.areaDescription}>{area.description}</Text>
            {flavorText && <Text style={styles.flavorText}>{flavorText}</Text>}
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              onPress={onShowEncounters}
              style={({ pressed }) => [
                styles.iconActionBtn,
                {
                  backgroundColor: "rgba(255,255,255,0.2)",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="eye-outline"
                size={20}
                color="#fff"
              />
            </Pressable>

            <Pressable
              onPress={onEnter}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={({ pressed }) => [
                styles.enterBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.enterBtnText}>ENTER</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AreaSelectScreen({
  navigation,
  route,
}: AreaSelectScreenProps) {
  const { region, team } = route.params;
  const [selectedAreaId, setSelectedAreaId] = useState<Area | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [encounterList, setEncounterList] = useState<any[]>([]);
  const [modalTitle, setModalTitle] = useState("");

  const flavorMap =
    region === "gen1"
      ? {
          plains: "Kanto Route 1 · Viridian Outskirts",
          mountain: "Mt. Ember · Victory Road Path",
          water: "Seafoam Islands · Cerulean Cape",
          cave: "Mt. Moon · Rock Tunnel Depths",
          urban: "Cinnabar Mansion · Power Plant",
          volcano: "Mt. Ember Crater · Fire Path",
          training: "Pallet Secret Meadow",
          safari: "Fuchsia Safari Zone",
        }
      : {
          plains: "Johto Route 29 · National Park",
          mountain: "Mt. Silver Peaks · Cliff Cave",
          water: "Whirl Islands · Olivine Coast",
          cave: "Dark Cave · Mt. Mortar Ruins",
          urban: "Burned Tower · Goldenrod Underground",
          volcano: "Mt. Silver Magma Chambers",
          training: "New Bark Training Field",
          safari: "Cianwood Safari Preserve",
        };

  function handleEnter(area: AreaConfig) {
    setSelectedAreaId(area.id);
    setTimeout(() => {
      navigation.navigate("EncounterFlow", {
        region,
        area: area.id,
        team,
      });
    }, 200);
  }

  function handleShowEncounters(area: AreaConfig) {
    setModalTitle(area.label);

    // Resolve the table
    const tableKey = `${region}${area.id.charAt(0).toUpperCase() + area.id.slice(1)}`;
    const tables: any = region === "gen1" ? gen1Tables : gen2Tables;
    const table = tables[tableKey];

    if (table) {
      const displayData = table
        .map((entry: any) => {
          const meta = ALL_POKEMON_META.find((p) => p.id === entry.id);
          return {
            id: entry.id,
            name: meta?.name || "Unknown",
            rate: (entry.rate * 100).toFixed(1),
            levels: `${entry.levels.min}-${entry.levels.max}`,
            image: getPokemonIcon(entry.id),
          };
        })
        .sort((a: any, b: any) => parseFloat(b.rate) - parseFloat(a.rate));

      setEncounterList(displayData);
      setModalVisible(true);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              {region.toUpperCase()} EXPLORATION
            </Text>
            <Text style={styles.title}>Select Area</Text>
            <Text style={styles.subtitle}>
              Each area holds unique Pokémon to discover
            </Text>
          </View>
          <View
            style={{
              width: 380,
              height: 200,
              position: "absolute",
              backgroundColor: "#03030392",
              zIndex: 0,
            }}
          >
            <Image
              source={banner}
              style={{
                height: 180,
                width: "100%",
                position: "absolute",
                opacity: 0.3,
              }}
            />
          </View>
        </View>

        {/* ── Areas ── */}
        <View style={styles.list}>
          {AREAS.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              flavorText={(flavorMap as any)[area.id]}
              onEnter={() => handleEnter(area)}
              onShowEncounters={() => handleShowEncounters(area)}
              isSelected={selectedAreaId === area.id}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Encounters Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle} Encounters</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <FlatList
              data={encounterList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.encounterItem}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: 40, height: 40, resizeMode: "contain" }}
                    />
                    <Text style={styles.encounterName}>
                      {item.name.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.encounterMeta}>
                    <Text style={styles.encounterLevels}>
                      Lv. {item.levels}
                    </Text>
                    <View style={styles.rateTag}>
                      <Text style={styles.rateText}>{item.rate}%</Text>
                    </View>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080c18",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    position: "relative",
    height: 180,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  backBtn: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  headerText: {
    gap: 4,
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.5,
    color: "white",
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#8b98a5",
  },
  list: {
    padding: 16,
    gap: 16,
  },
  areaCard: {
    height: 160,
    borderTopStartRadius: 20,
    borderBottomEndRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: "hidden",
    backgroundColor: "#111826",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  cardTop: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diffText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  cardBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  cardInfo: {
    flex: 1,
  },
  areaLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  areaDescription: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  flavorText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontStyle: "italic",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  enterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    gap: 6,
  },
  enterBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.modalOverlay,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  modalList: {
    gap: 12,
  },
  encounterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bgButtonStandard,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  encounterName: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  encounterMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  encounterLevels: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
  },
  rateTag: {
    backgroundColor: "#e8534a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rateText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
