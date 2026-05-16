import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
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
import { TypeBadge } from "../components/TypeBadge";
import { useAuth } from "../context/AuthContext";
import { useTeam } from "../hooks/useTeam";
import db from "../lib/db";
import { colors } from "../theme/color";
import { PokemonTeamScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const clickSound = require("../../assets/sounds/buttonClick.mp3");

export default function PokemonTeamScreen({
  route,
  navigation,
}: PokemonTeamScreenProps) {
  const { onSave } = route.params;
  const { user } = useAuth();
  const {
    team: dbTeam,
    refetch,
  } = useTeam(user?.id ?? "");
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  React.useEffect(() => {
    setTeam(dbTeam);
  }, [dbTeam]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
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

  const moveItem = (index: number, direction: -1 | 1) => {
    playClick("light");
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newTeam = [...team];
    const targetIndex = index + direction;
    [newTeam[index], newTeam[targetIndex]] = [
      newTeam[targetIndex],
      newTeam[index],
    ];
    setTeam(newTeam);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      db.withTransactionSync(() => {
        team.forEach((p, index) => {
          if (p.id) {
            db.runSync(`UPDATE pokemon SET pk_order = ? WHERE id = ?`, [
              index + 1,
              p.id.toString(),
            ]);
          }
        });
      });
      playClick("success");
      setStatusMessage("Team order saved!");
      setStatusType("success");
      setStatusVisible(true);
    } catch (error: any) {
      console.error(error);
      setStatusMessage("Failed to save order");
      setStatusType("error");
      setStatusVisible(true);
    } finally {
      setIsSaving(false);
      onSave?.();
    }
  };

  const renderItem = ({ item, index }: { item: Pokemon; index: number }) => {
    return (
      <View style={[styles.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderBadge}>#{index + 1}</Text>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.typeBadges}>
            {item.type.map((t) => (
              <TypeBadge key={t} type={t} size="small" />
            ))}
          </View>
        </View>

        <View style={styles.cardMain}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("PokemonStats", { pokemon: item })
            }
            style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
          >
            <Image
              source={{ uri: item.frontImage }}
              style={styles.sprite}
              resizeMode="contain"
            />
            <View style={styles.statsColumn}>
              <Text style={styles.level}>Lv. {item.level}</Text>
              <View style={styles.hpBarBg}>
                <View
                  style={[
                    styles.hpBarFill,
                    { width: `${(item.hp / item.maxHp) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.hpText}>
                {Math.ceil(item.hp)}/{item.maxHp} HP
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.controls}>
            <TouchableOpacity
              disabled={index === 0}
              onPress={() => moveItem(index, -1)}
              style={[styles.arrowBtn, index === 0 && styles.disabled]}
            >
              <Ionicons name="chevron-up" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={index === team.length - 1}
              onPress={() => moveItem(index, 1)}
              style={[
                styles.arrowBtn,
                index === team.length - 1 && styles.disabled,
              ]}
            >
              <Ionicons name="chevron-down" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={team}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListFooterComponent={
          team.length < 6 ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                playClick();
                navigation.navigate("SelectFromPC", {
                  teamLength: team.length,
                } as any);
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text style={styles.addButtonText}>Add Pokémon</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.swapButton}
            onPress={() =>
              navigation.navigate("SelectFromPC", {
                teamLength: team.length,
                isReplacing: true,
              } as any)
            }
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={20}
              color="white"
            />
            <Text style={styles.saveButtonText}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save Order"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <StatusModal
        visible={statusVisible}
        message={statusMessage}
        type={statusType}
        onClose={() => {
          setStatusVisible(false);
          if (statusType === "success") navigation.navigate("Dashboard");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 20, gap: 16 },
  card: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  orderBadge: {
    color: "#6B7280",
    fontWeight: "900",
    marginRight: 12,
    fontSize: 16,
  },
  name: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
    flex: 1,
    textTransform: "capitalize",
  },
  typeBadges: { flexDirection: "row", gap: 8 },
  cardMain: { flexDirection: "row", alignItems: "center", gap: 16 },
  sprite: { width: 70, height: 70 },
  statsColumn: { flex: 1, marginLeft: 20 },
  level: { color: "#9CA3AF", fontSize: 14, marginBottom: 6 },
  hpBarBg: {
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    overflow: "hidden",
  },
  hpBarFill: { height: "100%", backgroundColor: "#22c55e" },
  hpText: { color: "#9CA3AF", fontSize: 12, marginTop: 6 },
  controls: { flexDirection: "column", gap: 10 },
  arrowBtn: { backgroundColor: "#1F2937", padding: 10, borderRadius: 10 },
  disabled: { opacity: 0.3 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.modalContent,
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  addButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  footer: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: "#030712",
    borderTopWidth: 1,
    borderColor: "#1F2937",
  },
  buttonRow: { flexDirection: "row", gap: 12 },
  saveButton: {
    flex: 2,
    backgroundColor: "#818CF8",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  swapButton: {
    flex: 1,
    backgroundColor: "#F59E0B",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: { color: "white", fontWeight: "900", fontSize: 16 },
});
