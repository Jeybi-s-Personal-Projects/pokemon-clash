import type { Area } from "@/src/encounter/batchGenerator";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AreaSelectScreenProps } from "../types/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type AreaConfig = {
  id: Area;
  label: string;
  description: string;
  encounterHint: string;
  bgTop: string;
  bgBottom: string;
  accent: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  encounterRate: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const AREAS: AreaConfig[] = [
  {
    id: "plains",
    label: "Blooming Plains",
    description: "Sun-drenched meadows teeming with life.",
    encounterHint: "Pidgey, Sentret, Oddish...",
    bgTop: "#1a3a10",
    bgBottom: "#0e2208",
    accent: "#5dc840",
    icon: "grass",
    difficulty: "easy",
    encounterRate: "Common",
  },
  {
    id: "mountain",
    label: "Peak of Titans",
    description: "Jagged cliffs where only the strong survive.",
    encounterHint: "Geodude, Skarmory, Machop...",
    bgTop: "#3a2a10",
    bgBottom: "#1a1408",
    accent: "#c8a440",
    icon: "image-filter-hdr",
    difficulty: "hard",
    encounterRate: "Frequent",
  },
  {
    id: "water",
    label: "Azure Coast",
    description: "The rhythmic crashing of waves hide secrets.",
    encounterHint: "Lapras, Totodile, Staryu...",
    bgTop: "#0a1e38",
    bgBottom: "#060e20",
    accent: "#2090e0",
    icon: "water",
    difficulty: "medium",
    encounterRate: "Moderate",
  },
  {
    id: "cave",
    label: "Crystal Caverns",
    description: "Glowing gems illuminate the deep dark.",
    encounterHint: "Zubat, Unown, Onix...",
    bgTop: "#1a1428",
    bgBottom: "#0c0a18",
    accent: "#8060d0",
    icon: "cave",
    difficulty: "hard",
    encounterRate: "Moderate",
  },
  {
    id: "urban",
    label: "Abandoned Lab",
    description: "Flickering lights and humming machinery.",
    encounterHint: "Mewtwo, Elekid, Magnemite...",
    bgTop: "#2a2a2a",
    bgBottom: "#121212",
    accent: "#9aa4b2",
    icon: "factory",
    difficulty: "hard",
    encounterRate: "Rare finds",
  },
  {
    id: "volcano",
    label: "Magma Crater",
    description: "The air shimmers with intense heat.",
    encounterHint: "Magmar, Entei, Moltres...",
    bgTop: "#3a1010",
    bgBottom: "#1a0808",
    accent: "#ef4444",
    icon: "fire",
    difficulty: "hard",
    encounterRate: "Extreme",
  },
  {
    id: "training",
    label: "Training Grounds",
    description: "A sanctuary for rare and gifted Pokémon.",
    encounterHint: "Bulbasaur, Pikachu, Pichu...",
    bgTop: "#103a30",
    bgBottom: "#081a14",
    accent: "#10b981",
    icon: "sword-cross",
    difficulty: "medium",
    encounterRate: "Discovered",
  },
  {
    id: "safari",
    label: "Safari Zone",
    description: "The ultimate wilderness for true trackers.",
    encounterHint: "Scyther, Heracross, Chansey...",
    bgTop: "#2a3a10",
    bgBottom: "#141a08",
    accent: "#84cc16",
    icon: "compass",
    difficulty: "medium",
    encounterRate: "Diverse",
  },
];

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Beginner",
  medium: "Intermediate",
  hard: "Advanced",
};

const REGION_FLAVOR: Record<string, Partial<Record<Area, string>>> = {
  gen1: {
    plains: "Kanto Route 1 · Viridian Outskirts",
    mountain: "Mt. Ember · Victory Road Path",
    water: "Seafoam Islands · Cerulean Cape",
    cave: "Mt. Moon · Rock Tunnel Depths",
    urban: "Cinnabar Mansion · Power Plant",
    volcano: "Mt. Ember Crater · Fire Path",
    training: "Pallet Secret Meadow",
    safari: "Fuchsia Safari Zone",
  },
  gen2: {
    plains: "Johto Route 29 · National Park",
    mountain: "Mt. Silver Peaks · Cliff Cave",
    water: "Whirl Islands · Olivine Coast",
    cave: "Dark Cave · Mt. Mortar Ruins",
    urban: "Burned Tower · Goldenrod Underground",
    volcano: "Mt. Silver Magma Chambers",
    training: "New Bark Training Field",
    safari: "Cianwood Safari Preserve",
  },
};

// ─── Area card ────────────────────────────────────────────────────────────────

function AreaCard({
  area,
  flavorText,
  onPress,
  isSelected,
}: {
  area: AreaConfig;
  flavorText?: string;
  onPress: () => void;
  isSelected: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  const difficultyColor = {
    easy: "#22c55e",
    medium: "#f59e0b",
    hard: "#ef4444",
  }[area.difficulty];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.areaCard,
        {
          transform: [{ scale: pressed ? 0.98 : 1 }],
          borderColor: isSelected ? area.accent : "#222",
          backgroundColor: area.bgBottom,
        },
      ]}
    >
      {/* Accent strip */}
      <View style={[styles.areaAccent, { backgroundColor: area.accent }]} />

      <View style={styles.cardBody}>
        {/* LEFT */}
        <View style={styles.cardLeft}>
          <View style={styles.areaHeader}>
            <View style={[styles.iconBadge, { backgroundColor: area.bgTop }]}>
              <MaterialCommunityIcons
                name={area.icon as any}
                size={18}
                color={area.accent}
              />
            </View>

            <Text style={styles.areaName}>{area.label}</Text>
          </View>

          <Text style={styles.areaDesc}>{area.description}</Text>

          {flavorText && <Text style={styles.flavorText}>{flavorText}</Text>}

          {/* Difficulty */}
          <View
            style={[
              styles.diffBadge,
              { backgroundColor: difficultyColor + "22" },
            ]}
          >
            <View
              style={[styles.diffDot, { backgroundColor: difficultyColor }]}
            />
            <Text style={[styles.diffText, { color: difficultyColor }]}>
              {DIFFICULTY_LABEL[area.difficulty]}
            </Text>
          </View>
        </View>

        {/* RIGHT */}
        <View style={styles.cardRight}>
          <View style={styles.rateBadge}>
            <MaterialCommunityIcons name="pokeball" size={14} color="#9aa4b2" />
            <Text style={styles.encounterRate}>{area.encounterRate}</Text>
          </View>

          <Text style={styles.encounterHint}>{area.encounterHint}</Text>

          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AreaSelectScreen({
  navigation,
  route,
}: AreaSelectScreenProps) {
  const { region, team } = route.params;
  const [selected, setSelected] = useState<Area | null>(null);

  const flavorMap = REGION_FLAVOR[region] ?? {};

  function handleSelect(area: AreaConfig) {
    setSelected(area.id);
    setTimeout(() => {
      navigation.navigate("EncounterFlow", {
        region,
        area: area.id,
        team,
      });
    }, 200);
  }

  const onBack = () => navigation.goBack();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f1a" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Choose Area</Text>
          <Text style={styles.subtitle}>
            Each area has unique Pokémon encounters
          </Text>
        </View>

        {/* Areas */}
        <View style={styles.list}>
          {AREAS.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              flavorText={flavorMap[area.id]}
              onPress={() => handleSelect(area)}
              isSelected={selected === area.id}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0b0f1a",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  headerRow: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 16,
  },

  backBtn: {
    paddingVertical: 6,
  },

  backBtnText: {
    fontSize: 14,
    color: "#9aa4b2",
  },

  titleBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },

  title: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    color: "#8b98a5",
  },

  list: {
    paddingHorizontal: 12,
    gap: 10,
  },

  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  cardLeft: {
    flex: 1,
  },

  areaName: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
  },

  areaDesc: {
    fontSize: 13,
    color: "#aab4c3",
    marginBottom: 4,
  },

  flavorText: {
    fontSize: 12,
    color: "#6b7280",
  },

  cardRight: {
    alignItems: "flex-end",
    gap: 4,
  },

  diffText: {
    fontSize: 12,
    color: "#9aa4b2",
  },

  encounterRate: {
    fontSize: 12,
    color: "#9aa4b2",
  },

  encounterHint: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "right",
    maxWidth: 120,
  },
  areaAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },

  areaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
  },

  diffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  rateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  areaCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
