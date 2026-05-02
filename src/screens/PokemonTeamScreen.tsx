import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import StatusModal from "../components/statusModal";
import ExpBar from "../components/expBar";
import { useAuth } from "../context/AuthContext";
import { useTeam } from "../hooks/useTeam";
import { supabase } from "../lib/supabase";
import { colors } from "../theme/color";
import { PokemonTeamScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";
import { getExpForLevel } from "../utils/experienceCalculator";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

export default function PokemonTeamScreen({
  route,
  navigation,
}: PokemonTeamScreenProps) {
  const { onSave } = route.params;
  const { user } = useAuth();
  const { team: dbTeam, refetch, loading: isLoadingTeam } = useTeam(user?.id ?? "");
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  // Sync internal state with DB team on refetch
  React.useEffect(() => {
    if (dbTeam.length > 0) {
      setTeam(dbTeam);
    } else {
      setTeam([]);
    }
  }, [dbTeam]);

  // Refresh team when screen is focused
  useFocusEffect(
    useCallback(() => {
      refetch();
      setIsSwapMode(false);
    }, [])
  );

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = (type: "light" | "medium" | "success" = "medium") => {
    if (type === "light")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (type === "medium")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (type === "success")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    player.play();
  };

  const swap = (index1: number, index2: number) => {
    playClick("light");
    // Animate the reordering
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const newTeam = [...team];
    const temp = newTeam[index1];
    newTeam[index1] = newTeam[index2];
    newTeam[index2] = temp;
    setTeam(newTeam);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const updatePromises = team.map((p, index) =>
        supabase.from("pokemon").update({ pk_order: index + 1 }).eq("id", p.id),
      );

      const results = await Promise.all(updatePromises);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      playClick("medium");
      setStatusMessage("Team order saved successfully!");
      setStatusType("success");
      setStatusVisible(true);
    } catch (error: any) {
      setStatusMessage(error.message);
      setStatusType("error");
      setStatusVisible(true);
    } finally {
      setIsSaving(false);
    }
    onSave?.();
  };

  const renderItem = ({ item, index }: { item: Pokemon; index: number }) => {
    const primaryType = item.type[0];
    const accentColor = TYPE_COLORS[primaryType] ?? "#888";

    return (
      <View style={[
        styles.card, 
        { borderColor: accentColor + "44" },
        isSwapMode && { borderColor: "#FBBF24", borderWidth: 2 }
      ]}>
        {/* Glow effect based on type */}
        <View
          style={[
            styles.glowEffect,
            { backgroundColor: accentColor, opacity: 0.05 },
          ]}
        />

        <TouchableOpacity
          style={styles.cardClickArea}
          onPress={() => {
            playClick("light");
            if (isSwapMode) {
                navigation.navigate("SelectFromPC", {
                  teamLength: team.length,
                  replacedId: item.id,
                  replacedOrder: index + 1
                } as any);
            } else {
                navigation.navigate("PokemonStats", { pokemon: item });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.orderBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.orderBadgeText}>#{index + 1}</Text>
          </View>

          <Image
            source={{ uri: item.frontImage }}
            style={styles.sprite}
            resizeMode="contain"
          />

          {/* Type badges */}
          <View style={styles.typeBadges}>
            {item.type.map((t) => (
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

          <Text style={styles.name}>{item.name}</Text>

          {/* HP Bar */}
          <View style={styles.hpBarBg}>
            <View
              style={[
                styles.hpBarFill,
                {
                  width: `${(item.hp / item.maxHp) * 100}%`,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
          <View style={styles.hpTextRow}>
            <Text style={styles.hpLabel}>HP</Text>
            <Text style={styles.hpValue}>
              {Math.ceil(item.hp)}/{item.maxHp}
            </Text>
          </View>

          {/* EXP Bar */}
          <View style={{ width: "100%", marginTop: 10, marginBottom: 4 }}>
            <ExpBar
              exp={
                item.experience -
                getExpForLevel(item.level, item.growthRate || "medium-fast")
              }
              maxExp={
                getExpForLevel(item.level + 1, item.growthRate || "medium-fast") -
                getExpForLevel(item.level, item.growthRate || "medium-fast")
              }
            />
          </View>

          <Text style={styles.level}>Lv. {item.level}</Text>
          
          {isSwapMode && (
            <View style={styles.swapOverlay}>
              <MaterialCommunityIcons name="swap-horizontal" size={24} color="#FBBF24" />
              <Text style={styles.swapText}>REPLACE</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity
            disabled={index === 0 || isSwapMode}
            onPress={() => swap(index, index - 1)}
            style={[styles.arrowButton, (index === 0 || isSwapMode) && styles.disabledArrow]}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={index === team.length - 1 || isSwapMode}
            onPress={() => swap(index, index + 1)}
            style={[
              styles.arrowButton,
              (index === team.length - 1 || isSwapMode) && styles.disabledArrow,
            ]}
          >
            <MaterialCommunityIcons name="arrow-right" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {index === 0 && !isSwapMode && (
          <View style={[styles.battleTag, { borderColor: accentColor + "88" }]}>
            <Text style={[styles.battleTagText, { color: accentColor }]}>
              STARTER
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoadingTeam && team.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <Text style={styles.infoText}>
          {isSwapMode 
            ? "Tap a Pokémon in your team to replace it with one from your PC."
            : "The #1 Pokémon will be your first in battle. Tap a card to see stats or use arrows to reorder."
          }
        </Text>
      </View>

      <FlatList
        data={team}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderItem}
      />

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          {team.length < 6 && !isSwapMode && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                playClick();
                const teamIds = team
                  .map((p) => p.id)
                  .filter((id): id is string | number => id !== undefined);

                navigation.navigate("SelectFromPC", {
                  currentTeamIds: teamIds,
                  teamLength: team.length,
                });
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.swapBtn,
              isSwapMode && { backgroundColor: "#ef4444" },
              team.length === 0 && styles.disabledButton,
            ]}
            onPress={() => {
              playClick();
              setIsSwapMode(!isSwapMode);
            }}
            disabled={team.length === 0}
          >
            <MaterialCommunityIcons 
              name={isSwapMode ? "close-circle-outline" : "swap-horizontal"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.addButtonText}>{isSwapMode ? "Cancel" : "Swap"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (isSaving || isSwapMode) && styles.disabledButton,
              (team.length === 6 || isSwapMode) && { flex: 1 },
            ]}
            onPress={handleSave}
            disabled={isSaving || isSwapMode}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Order</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <StatusModal
        visible={statusVisible}
        message={statusMessage}
        type={statusType}
        onClose={() => {
          setStatusVisible(false);
          if (statusType === "success") {
            navigation.goBack();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  headerInfo: {
    padding: 16,
    backgroundColor: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  infoText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 12,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  glowEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardClickArea: {
    width: "100%",
    alignItems: "center",
  },
  orderBadge: {
    position: "absolute",
    top: -12,
    left: -12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomRightRadius: 16,
    zIndex: 10,
  },
  orderBadgeText: {
    color: "white",
    fontWeight: "900",
    fontSize: 14,
  },
  sprite: {
    width: 90,
    height: 90,
  },
  typeBadges: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  name: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "capitalize",
    marginTop: 6,
  },
  hpBarBg: {
    width: "100%",
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  hpBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  hpTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  hpLabel: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "bold",
  },
  hpValue: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
  },
  level: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 8,
  },
  swapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    borderRadius: 20,
  },
  swapText: {
    color: "#FBBF24",
    fontWeight: "900",
    fontSize: 12,
    marginTop: 4,
  },
  controls: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    paddingTop: 12,
    width: "100%",
    justifyContent: "center",
  },
  arrowButton: {
    backgroundColor: "#1F2937",
    width: 48,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  disabledArrow: {
    opacity: 0.1,
  },
  battleTag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#111827CC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  battleTagText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  footer: {
    padding: 20,
    paddingBottom: 70,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    backgroundColor: "#030712",
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#10B981",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  swapBtn: {
    backgroundColor: "#F59E0B",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#818CF8",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#818CF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
