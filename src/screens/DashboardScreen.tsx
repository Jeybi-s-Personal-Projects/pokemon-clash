import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DashboardHeader from "../components/dashboardHeader";
import PokemonCard from "../components/pokemonRosterCard";
import { useAuth } from "../context/AuthContext";
import { useTeam } from "../hooks/useTeam";
import { colors } from "../theme/color";
import { DashboardScreenProps } from "../types/navigation";

const clickSound = require("../../assets/sounds/buttonClick.mp3");

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user, signOut } = useAuth();
  const { team, loading, refetch } = useTeam(user?.id ?? "");

  const [activeIndex, setActiveIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setActiveIndex(index);
  };

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#818CF8" size="large" />
      </View>
    );

  // ...
  return (
    <View style={styles.container}>
      <DashboardHeader
        userName={user?.name ?? "Trainer"}
        team={team}
        onLogout={() => {
          playClick();
          signOut();
          navigation.replace("Login");
        }}
        onRefresh={() => {
          playClick();
          refetch();
        }}
        onEditTeam={() => {
          playClick();
          navigation.navigate("PokemonTeam", {
            initialTeam: team,
            onSave: refetch,
          });
        }}
        onViewList={() => {
          playClick();
          navigation.navigate("PokemonList", {
            mode: "view",
          });
        }}
      />

      {team.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="pokeball" size={60} color="#818CF8" />

          <Text style={styles.emptyTitle}>No Pokémon yet</Text>

          <Text style={styles.emptySubtitle}>
            Start your journey by recruiting your first team member.
          </Text>

          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              playClick();
              navigation.navigate("SelectPokemon", { team });
            }}
          >
            <Text style={styles.emptyButtonText}>Start Journey</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.carouselContainer}>
          <FlatList
            data={team}
            keyExtractor={(_, i) => i.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <PokemonCard
                  pokemon={item}
                  onPress={() => {
                    playClick();
                    navigation.navigate("PokemonStats", {
                      pokemon: item,
                      onRelease: refetch,
                    });
                  }}
                />
              </View>
            )}
          />
          <View style={styles.pagination}>
            {team.slice(0, 3).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === activeIndex % 3 ? "#818CF8" : "#374151",
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}
      <View style={styles.actionDock}>
        <TouchableOpacity
          style={[styles.battleButton, true && styles.disabled]}
          onPress={() => {
            playClick();
            if (team.length === 0) return;

            const playerPokemon = team[0];
            navigation.navigate("RegionSelect", {
              player: playerPokemon,
            });
          }}
          disabled={true}
        >
          <MaterialCommunityIcons name="pokeball" size={20} color="#ffffff" />
          <Text style={styles.actionText}>PVP Battle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exploreButton, team.length === 0 && styles.disabled]}
          onPress={() => {
            playClick();
            if (team.length === 0) return;

            const playerPokemon = team[0];
            navigation.navigate("RegionSelect", {
              player: playerPokemon,
            });
          }}
          disabled={team.length === 0}
        >
          <Ionicons name="compass" size={18} color="white" />
          <Text style={styles.actionText}>Explore</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#030712",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: "#030712",
  },
  greeting: { fontSize: 13, color: "#6B7280", letterSpacing: 0.5 },
  username: { fontSize: 24, fontWeight: "800", color: "#F9FAFB" },
  trainerBadge: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trainerBadgeText: { color: "#D1D5DB", fontSize: 13 },

  statsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#111827",
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  statBox: { alignItems: "center", flex: 1 },
  statNumber: { fontSize: 22, fontWeight: "bold", color: "#818CF8" },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "#1F2937" },

  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#F9FAFB" },
  addButton: {
    backgroundColor: colors.bgButton,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: "center",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },
  configureButton: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  configureButtonText: { color: "#818CF8", fontWeight: "bold", fontSize: 13 },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#818CF8",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  refreshButton: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  refreshButtonText: { color: "#9CA3AF", fontWeight: "bold", fontSize: 16 },

  logoutButton: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logoutButtonText: { color: "#EF4444", fontWeight: "bold", fontSize: 16 },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  actionDock: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingBottom: 70,
    marginBottom: "auto",
    backgroundColor: "#030712",
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
  },
  battleButton: {
    flex: 1,
    backgroundColor: "#818df8b4",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffffff70",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  exploreButton: {
    flex: 1,
    backgroundColor: "#34d3998f",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffffff70",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  actionText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  disabled: {
    backgroundColor: "#374151",
    opacity: 0.6,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  sectionSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  headerActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  carouselContainer: {
    height: 250,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderTopColor: colors.subtleNeonBlue,
    borderBottomColor: colors.subtleNeonBlue,
    backgroundColor: "#000000",
  },
  carouselContent: {
    alignItems: "center",
  },
  cardWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
