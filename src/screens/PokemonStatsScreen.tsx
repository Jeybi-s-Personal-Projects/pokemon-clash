import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import StatusModal from "../components/statusModal";
import { supabase } from "../lib/supabase";

import { PokemonStatsScreenProps } from "../types/navigation";

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

export default function PokemonStatsScreen({
  route,
  navigation,
}: PokemonStatsScreenProps) {
  const { pokemon } = route.params;
  const primaryType = pokemon.type[0];
  const accentColor = TYPE_COLORS[primaryType] ?? "#888";

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  const handleRelease = async () => {
    playClick();
    setConfirmVisible(false);
    setIsReleasing(true);

    try {
      // Supabase CASCADE delete should handle moves if set up,
      // but we'll just delete the pokemon.
      const { error } = await supabase
        .from("pokemon")
        .delete()
        .eq("id", pokemon.id);

      if (error) throw error;

      setStatusMessage(`${pokemon.name} was released into the wild.`);
      setStatusType("success");
      setStatusVisible(true);
    } catch (error: any) {
      setStatusMessage(error.message);
      setStatusType("error");
      setStatusVisible(true);
    } finally {
      setIsReleasing(false);
    }
  };

  const StatRow = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statBarBg}>
        <View
          style={[
            styles.statBarFill,
            {
              width: `${Math.min((value / 255) * 100, 100)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header / Image Section */}
        <View
          style={[styles.imageContainer, { borderColor: accentColor + "44" }]}
        >
          <View
            style={[styles.glow, { backgroundColor: accentColor + "22" }]}
          />
          <Image
            source={{ uri: pokemon.frontImage }}
            style={styles.sprite}
            resizeMode="contain"
          />
          <Text style={styles.name}>{pokemon.name}</Text>
          <View style={styles.typeBadges}>
            {pokemon.type.map((t: string) => (
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
          <Text style={styles.level}>Level {pokemon.level}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <StatRow label="HP" value={pokemon.maxHp} color="#FF5959" />
          <StatRow label="Attack" value={pokemon.attack || 0} color="#F08030" />
          <StatRow
            label="Defense"
            value={pokemon.defense || 0}
            color="#F8D030"
          />
          <StatRow
            label="Sp. Atk"
            value={pokemon.specialAttack || 0}
            color="#6890F0"
          />
          <StatRow
            label="Sp. Def"
            value={pokemon.specialDefense || 0}
            color="#78C850"
          />
          <StatRow label="Speed" value={pokemon.speed || 0} color="#F85888" />
        </View>

        {/* Moves Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moves</Text>
          <View style={styles.movesGrid}>
            {pokemon.moves.map((move: any, index: number) => (
              <View key={index} style={styles.moveCard}>
                <Text style={styles.moveName}>{move.name}</Text>
                <Text style={styles.movePower}>PWR: {move.power}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              playClick();
              navigation.goBack();
            }}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.releaseButton}
            onPress={() => {
              playClick();
              setConfirmVisible(true);
            }}
          >
            <Text style={styles.releaseButtonText}>Release</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirmation Modal */}
      <Modal transparent visible={confirmVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Release Pokemon?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to release your {pokemon.name.toUpperCase()}
              ? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  playClick();
                  setConfirmVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>No, Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleRelease}
              >
                <Text style={styles.confirmButtonText}>Yes, Release</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: "#030712",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  imageContainer: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    marginBottom: 20,
  },
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -20,
    alignSelf: "center",
  },
  sprite: {
    width: 150,
    height: 150,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textTransform: "capitalize",
    marginTop: 10,
  },
  typeBadges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  level: {
    color: "#9CA3AF",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    paddingBottom: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    color: "#9CA3AF",
    width: 80,
    fontSize: 14,
    fontWeight: "600",
  },
  statBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  statValue: {
    color: "white",
    width: 35,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
  movesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  moveCard: {
    width: "48%",
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  moveName: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  movePower: {
    color: "#818CF8",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#030712",
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    paddingBottom: 70,
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: "#1F2937",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  releaseButton: {
    flex: 1,
    backgroundColor: "#7F1D1D",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#991B1B",
  },
  releaseButtonText: {
    color: "#FCA5A5",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
