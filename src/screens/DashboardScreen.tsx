import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();

  const [activeIndex, setActiveIndex] = useState(0);

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

  return (
    <View style={[styles.container]}>
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

      <View style={styles.contentArea}>
        {team.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="pokeball" size={60} color="#818CF8" />

            <Text style={styles.emptyTitle}>No Pokémon yet</Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                playClick();
                navigation.navigate("SelectStarter");
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
      </View>

      <View style={styles.actionDock}>
        <TouchableOpacity
          style={[styles.battleButton, true && styles.disabled]}
          onPress={() => {
            playClick();
            if (team.length === 0) return;
            navigation.navigate("RegionSelect", { team });
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
            navigation.navigate("RegionSelect", { team });
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
  container: { flex: 1, backgroundColor: colors.bg, paddingVertical: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#030712",
  },
  contentArea: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F9FAFB",
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
  actionDock: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 15,
    paddingTop: 10,
    paddingHorizontal: 10,
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
  carouselContainer: {
    height: 220,
    paddingHorizontal: 10,
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
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
