import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Region } from "../encounter/batchGenerator";
import { RegionSelectScreenProps } from "../types/navigation";

// ─── Assets ───────────────────────────────────────────────────────────────────

const REGION_IMAGES: Record<string, any> = {
  gen1: require("../../assets/regions/1.jpg"),
  gen2: require("../../assets/regions/2.jpg"),
  gen3: require("../../assets/regions/3.jpg"),
  gen4: require("../../assets/regions/4.jpg"),
  gen5: require("../../assets/regions/5.jpg"),
  gen6: require("../../assets/regions/6.jpg"),
  gen7: require("../../assets/regions/7.jpg"),
  gen8: require("../../assets/regions/8.jpg"),
  gen9: require("../../assets/regions/9.jpg"),
};

// ─── Types ────────────────────────────────────────────────────────────────────

type RegionConfig = {
  id: string;
  label: string;
  generation: string;
  description: string;
  available: boolean;
  accentColor: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const REGIONS: RegionConfig[] = [
  {
    id: "gen1",
    label: "Kanto",
    generation: "GEN I",
    description: "The original region · 151 Pokémon",
    available: true,
    accentColor: "#e8534a",
  },
  {
    id: "gen2",
    label: "Johto",
    generation: "GEN II",
    description: "Land of tradition · 100 Pokémon",
    available: true,
    accentColor: "#7b68ee",
  },
  {
    id: "gen3",
    label: "Hoenn",
    generation: "GEN III",
    description: "Sea & sky · 135 Pokémon",
    available: false,
    accentColor: "#4a9eda",
  },
  {
    id: "gen4",
    label: "Sinnoh",
    generation: "GEN IV",
    description: "Myths & mountains · 107 Pokémon",
    available: false,
    accentColor: "#5b8dd9",
  },
  {
    id: "gen5",
    label: "Unova",
    generation: "GEN V",
    description: "Urban adventure · 156 Pokémon",
    available: false,
    accentColor: "#a0a0a0",
  },
  {
    id: "gen6",
    label: "Kalos",
    generation: "GEN VI",
    description: "Beauty & elegance · 72 Pokémon",
    available: false,
    accentColor: "#e8a0c8",
  },
  {
    id: "gen7",
    label: "Alola",
    generation: "GEN VII",
    description: "Island paradise · 88 Pokémon",
    available: false,
    accentColor: "#f5c542",
  },
  {
    id: "gen8",
    label: "Galar",
    generation: "GEN VIII",
    description: "Industrial wilds · 96 Pokémon",
    available: false,
    accentColor: "#7ecba1",
  },
  {
    id: "gen9",
    label: "Paldea",
    generation: "GEN IX",
    description: "Open horizons · 103 Pokémon",
    available: false,
    accentColor: "#e07b54",
  },
];

// ─── Region card ──────────────────────────────────────────────────────────────

function RegionCard({
  region,
  onPress,
  isSelected,
}: {
  region: RegionConfig;
  onPress: () => void;
  isSelected: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const image = REGION_IMAGES[region.id];

  function handlePressIn() {
    if (!region.available) return;
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 50,
      bounciness: 2,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!region.available}
    >
      <Animated.View
        style={[
          styles.regionCard,
          { transform: [{ scale: scaleAnim }] },
          isSelected && {
            borderColor: region.accentColor,
            shadowColor: region.accentColor,
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 10,
          },
          !region.available && { opacity: 0.45 },
        ]}
      >
        {/* Background image */}
        <ImageBackground
          source={image}
          style={StyleSheet.absoluteFill}
          imageStyle={{ borderRadius: 14 }}
        >
          {/* Dark gradient overlay — stronger at bottom for text legibility */}
          <View style={styles.gradientOverlay} />

          {/* Top row: generation badge */}
          <View style={styles.cardTop}>
            <View
              style={[
                styles.genBadge,
                {
                  borderColor: "white",
                },
              ]}
            >
              <Text style={[styles.genBadgeText, { color: "white" }]}>
                {region.generation}
              </Text>
            </View>

            {!region.available && (
              <View style={styles.comingSoonBadge}>
                <Ionicons
                  name="lock-closed"
                  size={9}
                  color="#aaa"
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </View>

          {/* Bottom row: region name + description + arrow */}
          <View style={styles.cardBottom}>
            <View style={styles.cardBottomText}>
              <Text style={styles.regionLabel}>{region.label}</Text>
              <Text style={styles.regionDescription}>{region.description}</Text>
            </View>

            {region.available && (
              <View
                style={[
                  styles.arrowButton,
                  { backgroundColor: region.accentColor },
                ]}
              >
                <Ionicons name="arrow-forward" size={15} color="#fff" />
              </View>
            )}
          </View>
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
}

// ─── Decorative Pokéball bg circle ────────────────────────────────────────────

function PokeballDecor() {
  return (
    <View style={styles.pokeballDecor} pointerEvents="none">
      <View style={styles.pokeballOuter}>
        <View style={styles.pokeballDivider} />
        <View style={styles.pokeballCenter} />
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RegionSelectScreen({
  navigation,
  route,
}: RegionSelectScreenProps) {
  const { team } = route.params;
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(region: RegionConfig) {
    if (!region.available) return;
    setSelected(region.id);
    setTimeout(() => {
      navigation.navigate("AreaSelect", {
        region: region.id as Region,
        team,
      });
    }, 200);
  }

  const availableCount = REGIONS.filter((r) => r.available).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <PokeballDecor />

          <View style={styles.headerMeta}>
            <Text style={styles.eyebrow}>
              {availableCount} of {REGIONS.length} available
            </Text>
          </View>

          <Text style={styles.title}>Choose Your{"\n"}Region</Text>
          <Text style={styles.subtitle}>Where will your adventure begin?</Text>
        </View>

        {/* ── Cards ── */}
        <View style={styles.list}>
          {REGIONS.map((region) => (
            <RegionCard
              key={region.id}
              region={region}
              onPress={() => handleSelect(region)}
              isSelected={selected === region.id}
            />
          ))}
        </View>

        <Text style={styles.footer}>More regions arriving soon ✦</Text>
      </ScrollView>
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
    paddingBottom: 48,
  },

  // ── Header ──

  header: {
    paddingTop: Platform.OS === "ios" ? 64 : 44,
    paddingHorizontal: 24,
    paddingBottom: 28,
    marginBottom: 20,
    overflow: "hidden",
    backgroundColor: "#5651c370",
  },

  pokeballDecor: {
    position: "absolute",
    top: -80,
    right: -80,
    opacity: 0.06,
  },

  pokeballOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 18,
    borderColor: "#fff",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  pokeballDivider: {
    position: "absolute",
    width: "100%",
    height: 18,
    backgroundColor: "#fff",
    top: "50%",
    marginTop: -9,
  },

  pokeballCenter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 18,
    borderColor: "#fff",
    backgroundColor: "#080c18",
    zIndex: 2,
  },

  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: "#e8534a",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7a8d",
    letterSpacing: 0.2,
  },

  // ── List ──

  list: {
    paddingHorizontal: 16,
    gap: 14,
  },

  // ── Card ──

  regionCard: {
    height: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffffff",
    overflow: "hidden",
    backgroundColor: "#111826",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    // simulate gradient: transparent top → dark bottom
    backgroundColor: "transparent",
    borderRadius: 14,
    // layered using two views below
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingTop: 12,
    // subtle top scrim
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  genBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },

  genBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ffffff18",
  },

  comingSoonText: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  cardBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  cardBottomText: {
    flex: 1,
  },

  regionLabel: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
    marginBottom: 2,
  },

  regionDescription: {
    fontSize: 11,
    color: "#ffffffaa",
    letterSpacing: 0.2,
  },

  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginBottom: 2,
  },

  // ── Footer ──

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#3d4a5c",
    marginTop: 28,
    letterSpacing: 0.5,
  },
});
