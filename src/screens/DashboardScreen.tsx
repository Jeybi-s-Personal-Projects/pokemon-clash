import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PokemonCard from "../components/pokemonRosterCard";
import { useAuth } from "../context/AuthContext";
import { getPokemon } from "../hooks/usePokemon";
import { useTeam } from "../hooks/useTeam";
import { colors } from "../theme/color";
import { DashboardScreenProps } from "../types/navigation";

const clickSound = require("../../assets/sounds/buttonClick.mp3");

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user, signOut } = useAuth();
  const { team, loading, refetch } = useTeam(user?.id ?? "");

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  const handleBattle = async () => {
    playClick();
    if (team.length === 0) {
      Alert.alert("No Pokémon", "Add a Pokémon to your team first!");
      return;
    }
    try {
      // The first pokemon in the sorted list is our starter
      const playerPokemon = team[0];
      const enemy = await getPokemon("Blastoise", 40);
      navigation.navigate("Battle", {
        player: playerPokemon,
        enemy,
        onSave: refetch, // Pass refetch to update dashboard after swaps
      } as any);
    } catch (e) {
      Alert.alert("Error", "Could not load battle. Try again.");
    }
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#818CF8" size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>

          <Text style={styles.username}>
            {user?.name ?? "Trainer"}{" "}
            <Text style={{ color: "#818CF8" }}>✦</Text>
          </Text>

          <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
            Ready for your next battle?
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.trainerBadge}>
            <Ionicons name="ribbon" size={14} color="#818CF8" />
            <Text style={styles.trainerBadgeText}>Elite Trainer</Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              playClick();
              signOut();
              navigation.replace("Login");
            }}
          >
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <StatItem
          icon="account-group"
          label="Team"
          value={`${team.length}/6`}
          color="#818CF8"
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
          color="#fbbf24"
        />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        {/* Title */}
        <View>
          <Text style={styles.sectionTitle}>Pokémon Team</Text>
          <Text style={styles.sectionSub}>Manage your active party</Text>
        </View>

        {/* Actions */}
        <View style={styles.headerActions}>
          <IconButton
            icon="refresh"
            color="#9CA3AF"
            onPress={() => {
              playClick();
              refetch();
            }}
          />

          <IconButton
            icon="pencil"
            color="#818CF8"
            onPress={() => {
              playClick();
              navigation.navigate("PokemonTeam", {
                initialTeam: team,
                onSave: refetch,
              });
            }}
          />

          <IconButton
            icon="view-grid"
            color="#34d399"
            onPress={() => {
              playClick();
              navigation.navigate("PokemonList", {
                mode: "view",
              });
            }}
          />
        </View>
      </View>

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
        <FlatList
          data={team}
          keyExtractor={(_, i) => i.toString()}
          numColumns={2}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <PokemonCard
              pokemon={item}
              onPress={() => {
                playClick();
                navigation.navigate("PokemonStats", { pokemon: item });
              }}
            />
          )}
        />
      )}
      <View style={styles.actionDock}>
        <TouchableOpacity
          style={[styles.battleButton, team.length === 0 && styles.disabled]}
          onPress={handleBattle}
          disabled={team.length === 0}
        >
          <Ionicons name="flash" size={18} color="white" />
          <Text style={styles.actionText}>Battle</Text>
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
    borderRadius: 16,
    paddingVertical: 16,
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
  battleContainer: {
    padding: 16,
    paddingBottom: 70,
    backgroundColor: "#030712",
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    flexDirection: "row",
    gap: 10,
  },

  battleButtonDisabled: {
    backgroundColor: "#374151",
  },
  battleButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },

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
    backgroundColor: "#030712",
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
  },

  battleButton: {
    flex: 1,
    backgroundColor: "#4338ca",
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  exploreButton: {
    flex: 1,
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 16,
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
});
function IconButton({
  icon,
  onPress,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
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
      <Text style={{ fontSize: 18, fontWeight: "700", color, marginTop: 4 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: "#6B7280" }}>{label}</Text>
    </View>
  );
}
