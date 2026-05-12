import { Modal, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal as RNModal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PokemonCard from "../components/pokemonRosterCard";
import { useAuth } from "../context/AuthContext";
import { savePokemon } from "../hooks/savePokemon";
import { getPokemon } from "../hooks/usePokemon";
import { colors } from "../theme/color";
import { SelectStarterScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";
import { parseRawMoves, selectMoves } from "../utils/moveSelector";

const clickSound = require("../../assets/sounds/buttonClick.mp3");

const STARTER_NAMES = [
  "bulbasaur",
  "charmander",
  "squirtle",
  "chikorita",
  "cyndaquil",
  "totodile",
];

export default function SelectStarterScreen({
  navigation,
}: SelectStarterScreenProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [starters, setStarters] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<Pokemon | null>(null);

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  useEffect(() => {
    loadStarters();
  }, []);

  const loadStarters = async () => {
    try {
      const promises = STARTER_NAMES.map((name) => getPokemon(name, 5));
      const results = await Promise.all(promises);
      setStarters(results);
    } catch (error) {
      console.error("Failed to load starters:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmSelection = async () => {
    if (!confirmModal || selecting || !user) return;
    playClick();
    setSelecting(true);
    setConfirmModal(null);

    try {
      await savePokemon(confirmModal, user.id);
      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      });
    } catch (error) {
      console.error("Failed to save starter:", error);
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Preparing starters...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Partner</Text>
        <Text style={styles.subtitle}>
          Select your first Pokémon to begin your journey.
        </Text>
      </View>

      <FlatList
        data={starters}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <PokemonCard 
              pokemon={item} 
              onPress={() => {
                playClick();
                setConfirmModal(item);
              }} 
            />
          </View>
        )}
      />

      <RNModal visible={!!confirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose {confirmModal?.name.toUpperCase()}?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want {confirmModal?.name} as your partner? This choice is permanent.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmModal(null)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmSelection}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>

      {selecting && (
        <View style={styles.overlay}>
          <ActivityIndicator color="white" size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.modalBackgroundPrimary,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  loadingText: {
    color: "#9CA3AF",
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.modalBorderSubtle,
    backgroundColor: colors.modalBackground,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardWrapper: {
    flex: 0.48,
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
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
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    alignItems: "center",
  },
  cancelButtonText: { color: "white", fontWeight: "bold" },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#818CF8",
    alignItems: "center",
  },
  confirmButtonText: { color: "white", fontWeight: "bold" },
});
