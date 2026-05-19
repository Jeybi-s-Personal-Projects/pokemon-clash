import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { useTrainer } from "../hooks/useTrainer";
import { colors } from "../theme/color";
import { DashboardScreenProps } from "../types/navigation";

const clickSound = require("../../assets/sounds/buttonClick.mp3");

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user, signOut } = useAuth();
  const {
    team,
    loading: teamLoading,
    refetch: refetchTeam,
  } = useTeam(user?.id ?? "");
  const {
    stats,
    loading: trainerLoading,
    refetch: refetchTrainer,
  } = useTrainer(user?.id);
  const insets = useSafeAreaInsets();

  const [activeIndex, setActiveIndex] = useState(0);
  const [profileVisible, setProfileVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetchTeam();
      refetchTrainer();
    }, [refetchTeam, refetchTrainer]),
  );

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

  const handleRefresh = () => {
    playClick();
    refetchTeam();
    refetchTrainer();
  };

  if (teamLoading || trainerLoading)
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
        pokecoins={stats?.pokecoins || 0}
        onRefresh={handleRefresh}
        onEditTeam={() => {
          playClick();
          navigation.navigate("PokemonTeam", {
            initialTeam: team,
            onSave: refetchTeam,
          });
        }}
        onViewList={() => {
          playClick();
          navigation.navigate("PokemonList", {
            mode: "view",
          });
        }}
        onProfilePress={() => {
          playClick();
          setProfileVisible(true);
        }}
        onPokemartPress={() => {
          playClick();
          navigation.navigate("Pokemart");
        }}
        onMegaRaidPress={() => {
          playClick();
          navigation.navigate("MegaRaid");
        }}
      />

      {/* Profile Modal */}
      <Modal
        visible={profileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {(user?.name || "T").charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileUsername}>@{user?.username}</Text>
            </View>

            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>
                  {stats?.total_battles || 0}
                </Text>
                <Text style={styles.profileStatLabel}>Battles</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>
                  {stats?.total_wins || 0}
                </Text>
                <Text style={styles.profileStatLabel}>Wins</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>
                  {stats?.highest_streak || 0}
                </Text>
                <Text style={styles.profileStatLabel}>Best Streak</Text>
              </View>
            </View>

            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.logoutProfileButton}
                onPress={() => {
                  playClick();
                  setProfileVisible(false);
                  signOut();
                  navigation.replace("Login");
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#FCA5A5" />
                <Text style={styles.logoutProfileButtonText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeProfileButton}
                onPress={() => {
                  playClick();
                  setProfileVisible(false);
                }}
              >
                <Text style={styles.closeProfileButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                        onRelease: refetchTeam,
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
  container: {
    flex: 1,
    backgroundColor: colors.modalBackgroundPrimary,
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.modalBackground,
  },
  contentArea: {
    flex: 1,
    justifyContent: "center",
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
    borderTopWidth: 1,
    backgroundColor: "#030303",
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
    height: 210,
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
    marginTop: 10,
    paddingVertical: 5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  profileModal: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#818CF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#374151",
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  profileUsername: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 4,
  },
  profileStats: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  profileStatItem: {
    flex: 1,
    alignItems: "center",
  },
  profileStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  profileStatLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  profileStatDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#374151",
  },
  profileActions: {
    width: "100%",
    gap: 12,
  },
  logoutProfileButton: {
    width: "100%",
    backgroundColor: "#7F1D1D",
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#991B1B",
  },
  logoutProfileButtonText: {
    color: "#FCA5A5",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeProfileButton: {
    width: "100%",
    backgroundColor: "#374151",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  closeProfileButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
