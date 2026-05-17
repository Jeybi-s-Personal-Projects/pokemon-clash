import { colors } from "@/src/theme/color";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Pokemon } from "../types/pokemon";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  userName: string;
  team: Pokemon[];
  pokecoins: number;
  onRefresh: () => void;
  onEditTeam: () => void;
  onViewList: () => void;
  onProfilePress: () => void;
  onPokemartPress: () => void;
};

const BADGES = [
  require("../../assets/badges/badge-dragon.png"),
  require("../../assets/badges/badge-fighting.png"),
  require("../../assets/badges/badge-ground.png"),
  require("../../assets/badges/badge-ice.png"),
  require("../../assets/badges/badge-leaf-non.png"),
  require("../../assets/badges/badge-poison.png"),
  require("../../assets/badges/badge-rock.png"),
  require("../../assets/badges/bagde-water.png"),
];
const banner = require("../../assets/banners/banner.jpg");
const dynamaxRaidBanner = require("../../assets/banners/banner-dynamax-raid.jpg");
const pokestore = require("../../assets/banners/banner-pokestore.jpg");
const pokecoin = require("../../assets/icons/pokecoin.png");

const BANNER_CONTENT = [
  {
    image: banner,
    title: "Mega Raid",
    subtitle: "Ultra Trials",
    details: "Take down Mega Evolved bosses!",
    icon: "sword-cross",
    buttonText: "Battle",
    onPress: () => console.log("Mega Raid Battle"),
    layout: "right",
  },
  {
    image: dynamaxRaidBanner,
    title: "Dynamax Raid",
    subtitle: "Giant Challenges",
    details: "Face off against towering Dynamax Pokémon!",
    icon: "lightning-bolt",
    buttonText: "Join Raid",
    onPress: () => console.log("Dynamax Raid Battle"),
    layout: "right",
  },
  {
    image: pokestore,
    title: "Pokemart",
    subtitle: "Supplies & Gear",
    details: "Restock Pokéballs and healing items.",
    icon: "storefront",
    buttonText: "Shop Now",
    onPress: () => console.log("Pokemart Shop"),
    layout: "right",
  },
];

const obtained = 4;
export default function DashboardHeader({
  userName,
  team,
  pokecoins,
  onRefresh,
  onEditTeam,
  onViewList,
  onProfilePress,
  onPokemartPress,
}: Props) {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const bannerContent = [
    {
      image: banner,
      title: "Mega Raid",
      subtitle: "Ultra Trials",
      details: "Take down Mega Evolved bosses!",
      icon: "sword-cross",
      buttonText: "Battle",
      onPress: () => console.log("Mega Raid Battle"),
    },
    {
      image: dynamaxRaidBanner,
      title: "Dynamax Raid",
      subtitle: "Giant Challenges",
      details: "Face off against towering Dynamax Pokémon!",
      icon: "lightning-bolt",
      buttonText: "Join Raid",
      onPress: () => console.log("Dynamax Raid Battle"),
    },
    {
      image: pokestore,
      title: "Pokemart",
      subtitle: "Supplies & Gear",
      details: "Restock Pokéballs and healing items.",
      icon: "storefront",
      buttonText: "Shop Now",
      onPress: onPokemartPress,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % bannerContent.length;
        flatListRef.current?.scrollToIndex({
          index: next,
          animated: true,
        });
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7}>
            <Text style={styles.username}>
              {userName}{" "}
              <MaterialCommunityIcons
                name="pokeball"
                size={25}
                color="#818CF8"
              />
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.coinBadge}>
            <Image
              source={pokecoin}
              style={{ width: 22, height: 22, resizeMode: "contain" }}
            />
            <Text style={styles.coinBadgeText}>
              {pokecoins.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <LinearGradient
        colors={["#010101", "#323232"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={styles.badgeContainer}
      >
        {BADGES.map((badge, index) => (
          <Image
            key={index}
            source={badge}
            style={[
              styles.badgeImage,
              index >= 4 && { opacity: 0.2 }, // Last 4 badges look unobtained
            ]}
          />
        ))}
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.badgeStatsBar}>
          <Text style={styles.quickStatsLabel}>Quick Stats</Text>
          <View style={styles.badgeProgressRow}>
            {/* Background segments (all gray) */}
            {BADGES.map((_, index) => (
              <View
                key={index}
                style={[styles.badgeSegment, styles.badgeSegmentEmpty]}
              />
            ))}

            {/* Gradient overlay — width proportional to obtained badges */}
            <LinearGradient
              colors={["#818CF8", "#34d399"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.badgeGradientOverlay,
                { width: `${(obtained / BADGES.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.badgeCountLabel}>
            Kanto Badges ({BADGES.filter((_, i) => i < 4).length}/
            {BADGES.length})
          </Text>
        </View>

        <View style={styles.statsBar}>
          <StatItem
            icon="account-group"
            label="Team"
            value={`${team.length}/6`}
            color="#34d399"
          />
          <View style={styles.statDivider} />
          <StatItem
            icon="trending-up"
            label="Top Lv."
            value={team.length > 0 ? Math.max(...team.map((p) => p.level)) : 0}
            color="#34d399"
          />
          <View style={styles.statDivider} />
          <StatItem
            icon="shape-outline"
            label="Types"
            value={[...new Set(team.flatMap((p) => p.type))].length}
            color="#34d399"
          />
        </View>
      </View>

      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={bannerContent}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item }) => (
            <View style={styles.bannerItem}>
              <Image source={item.image} style={styles.bannerImage} />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bannerOverlay}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerHeader}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={28}
                      color={colors.neonOrange}
                    />
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.bannerTitle}>{item.title}</Text>
                      <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>

                  <Text style={styles.bannerDetails}>{item.details}</Text>

                  <TouchableOpacity
                    style={styles.bannerButton}
                    onPress={item.onPress}
                  >
                    <Text style={styles.bannerButtonText}>
                      {item.buttonText}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          )}
        />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Pokémon Team</Text>
        </View>

        <View style={styles.headerActions}>
          <IconButton icon="refresh" color="#818CF8" onPress={onRefresh} />
          <IconButton icon="pencil" color="#818CF8" onPress={onEditTeam} />
          <IconButton icon="view-grid" color="#818CF8" onPress={onViewList} />
        </View>
      </View>
    </>
  );
}

function IconButton({
  icon,
  onPress,
  color,
}: {
  icon: any;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.iconButton}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </TouchableOpacity>
  );
}

function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      <Text style={{ fontSize: 14, fontWeight: "700", color, marginTop: 4 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 8, color: "#6B7280" }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: colors.modalBackgroundPrimary,
  },
  greeting: { fontSize: 13, color: "#6B7280", letterSpacing: 0.5 },
  username: { fontSize: 24, fontWeight: "800", color: "#F9FAFB" },
  coinBadge: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coinBadgeText: {
    color: "#FACC15",
    fontSize: 14,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  statsBar: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#111827",
    borderTopEndRadius: 10,
    borderBottomEndRadius: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.subtleNeonBlue,
  },
  badgeStatsBar: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#111827",
    borderTopStartRadius: 10,
    borderBottomStartRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.subtleNeonBlue,
  },
  quickStatsLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  badgeProgressRow: {
    flexDirection: "row",
    gap: 1,
    alignItems: "center",
    paddingHorizontal: 10,
    position: "relative",
  },
  badgeGradientOverlay: {
    position: "absolute",
    left: 10,
    top: 0,
    bottom: 0,
    borderRadius: 1,
  },
  badgeSegment: {
    flex: 1,
    height: 6,
    borderRadius: 1,
  },
  badgeSegmentFilled: {
    backgroundColor: "#34d399",
  },
  badgeSegmentEmpty: {
    backgroundColor: "#374151",
  },
  badgeCountLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 5,
  },
  badgeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#111827",
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.subtleNeonBlue,
  },
  statDivider: { width: 1, height: 30, backgroundColor: "#1F2937" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#F9FAFB" },
  sectionSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: colors.subtleNeonBlue,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  badgeImage: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  carouselContainer: {
    height: 140,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    marginBottom: 8,
  },
  bannerItem: {
    width: SCREEN_WIDTH - 32, // Container margin
    height: 140,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "flex-end", // Enforce right alignment for the overlay content
    padding: 16,
  },
  bannerContent: {
    width: "100%",
    gap: 4,
    alignItems: "flex-end", // Enforce right alignment for content
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "right", // Enforce right alignment for title
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bannerSubtitle: {
    color: colors.neonOrange, // Changed to a more visible color
    fontSize: 12,
    fontWeight: "600",
    marginTop: -2,
    textAlign: "right",
  },
  bannerDetails: {
    color: "#E5E7EB",
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 8,
    maxWidth: "80%",
    textAlign: "right", // Enforce right alignment for details
  },
  bannerButton: {
    backgroundColor: colors.neonOrange, // More visible background
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerButtonText: {
    color: "#111827", // Dark text on light background
    fontWeight: "bold",
    fontSize: 12,
  },
});
