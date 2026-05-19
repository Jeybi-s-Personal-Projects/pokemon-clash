import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import { useEffect, useState, useRef } from "react";
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Item, MegaStoneCategory } from "../data/items/items";
import { useInventory } from "../hooks/useInventory";
import { getPokemon } from "../hooks/usePokemon";
import { useTeam } from "../hooks/useTeam";
import { colors } from "../theme/color";
import { MegaRaidBattleScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";
import { applyMegaEvolution } from "../utils/megaEvolutionUtils";
import { Battle } from "./BattleScreen";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const music1 = require("../../assets/sounds/music/mega-raid/mega-battle-music-1.mp3");
const music2 = require("../../assets/sounds/music/mega-raid/mega-battle-music-2.mp3");
const milestoneSound = require("../../assets/sounds/milestone.mp3");

const LOADING_PHASES = [
  "Detecting Mega Energy spike...",
  "Calibrating Keystone resonance...",
  "Identifying Boss signature...",
  "Stabilizing Battle Field...",
  "Ready for Raid Encounter!",
];

/**
 * MegaRaidBattleScreen Logic:
 * This screen acts as a wrapper for the core 'Battle' component.
 * It provides the specific 'context' for a Mega Raid:
 * 1. Generates a Level 60 Mega Boss.
 * 2. Manages Raid-specific rewards (Mega Stones).
 * 3. Handles unique background music (alternating loop).
 * 4. Displays a custom Victory Modal.
 */
type RaidParams = {
  megaStone: Item<MegaStoneCategory>;
};

export default function MegaRaidBattleScreen({
  navigation,
  route,
}: MegaRaidBattleScreenProps) {
  const params = route.params as RaidParams;
  const megaStone = params.megaStone;
  const { user } = useAuth();
  const userId = user?.id || "";
  const { team, loading: teamLoading } = useTeam(userId);
  const { addItem } = useInventory(userId);
  const [victoryModalVisible, setVictoryModalVisible] = useState(false);
  const [enemyPokemon, setEnemyPokemon] = useState<Pokemon | null>(null);

  // Loading animation state
  const [loadingPhase, setLoadingPhase] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Audio setup
  const [currentTrack, setCurrentTrack] = useState(Math.random() < 0.5 ? 1 : 2);
  const player1 = useAudioPlayer(music1);
  const player2 = useAudioPlayer(music2);
  const milestonePlayer = useAudioPlayer(milestoneSound);

  const status1 = useAudioPlayerStatus(player1);
  const status2 = useAudioPlayerStatus(player2);

  // Initialize Audio Mode and Start Playback
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });

    // Explicitly play on mount
    if (currentTrack === 1) {
      player1.loop = true;
      player1.play();
    } else {
      player2.loop = true;
      player2.play();
    }

    return () => {
      // Don't call pause here to avoid "already released" errors
      // expo-audio players created with useAudioPlayer clean up automatically
    };
  }, []);

  // Loading animations
  useEffect(() => {
    if (!enemyPokemon) {
      // 1. Progress Bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start();

      // 2. Pulse Icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 3. Phase cycles
      const interval = setInterval(() => {
        setLoadingPhase((p) => (p < LOADING_PHASES.length - 1 ? p + 1 : p));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [enemyPokemon]);

  // Handle Track Playback and pausing during victory
  useEffect(() => {
    if (victoryModalVisible) {
      if (player1) player1.pause();
      if (player2) player2.pause();
    }
  }, [victoryModalVisible, player1, player2]);

  useEffect(() => {
    const initRaid = async () => {
      const megaOf = megaStone.category.megaOf;
      if (!megaOf) return;

      const megaPokemon = await getPokemon(megaOf, 60);

      // Apply Mega stats
      const megaPokemonData: Pokemon = {
        ...megaPokemon,
        heldItem: megaStone.id, // Set the stone as held item to trigger applyMegaEvolution
      };
      const megaBoss = await applyMegaEvolution(megaPokemonData);

      // Force sprite to Showdown animation URL (Front)
      const megaForm = megaStone.category.megaForm;
      const parts = megaForm.split("-");
      const baseName = parts[1];
      const suffix = parts[2] ? `mega${parts[2]}` : "mega";
      const spriteId = `${baseName}-${suffix}`;

      let folder = "xyani";
      if (
        megaStone.category.megaForm.includes("clefable") ||
        megaStone.category.megaForm.includes("starmie") ||
        megaStone.category.megaForm.includes("dragonite") ||
        megaStone.category.megaForm.includes("meganium") ||
        megaStone.category.megaForm.includes("feraligatr") ||
        megaStone.category.megaForm.includes("skarmory")
      ) {
        folder = "ani";
      }

      if (megaBoss.isShiny) {
        folder += "-shiny";
      }

      const frontImage = `https://play.pokemonshowdown.com/sprites/${folder}/${spriteId}.gif`;

      // Artificial delay to show loading bar
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setEnemyPokemon({
        ...megaBoss,
        level: 60,
        hp: megaBoss.maxHp,
        maxHp: megaBoss.maxHp,
        frontImage: frontImage,
      });
    };
    initRaid();
  }, [megaStone]);

  if (!enemyPokemon || teamLoading || team.length === 0) {
    return (
      <View style={styles.loading}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 40 }}>
          <Image
            source={require("@/assets/icons/mega-evolution-icon.png")}
            style={{ width: 80, height: 80 }}
          />
        </Animated.View>
        
        <View style={styles.loadingTextContainer}>
          <Text style={styles.loadingTitle}>MEGA RAID</Text>
          <Text style={styles.loadingPhase}>{LOADING_PHASES[loadingPhase]}</Text>
        </View>

        <View style={styles.progressBarBg}>
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"]
                })
              }
            ]} 
          />
        </View>

        <View style={styles.loadingFooter}>
          <MaterialCommunityIcons name="broadcast" size={16} color={colors.accent} />
          <Text style={styles.footerText}>Syncing Keystone Data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Battle
        player={team[0]} // Use active Pokémon
        team={team}
        enemy={enemyPokemon}
        isMegaRaid={true}
        onRun={() => navigation.goBack()}
        onBattleEnd={(winner) => {
          if (winner === "player") {
            addItem(megaStone.id, 1);
            milestonePlayer.seekTo(0);
            milestonePlayer.play();
            setVictoryModalVisible(true);
          } else {
            navigation.goBack();
          }
        }}
      />

      <Modal transparent visible={victoryModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.victoryTitle}>VICTORY!</Text>
            <Text style={styles.victoryText}>
              You obtained the {megaStone.name}!
            </Text>
            <Image
              source={{
                uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${megaStone.id}.png`,
              }}
              style={styles.rewardImage}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeBtnText}>CLAIM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.modalBackground,
  },
  loading: {
    flex: 1,
    backgroundColor: "#080B14",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingTextContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  loadingTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 8,
  },
  loadingPhase: {
    color: colors.accent,
    fontSize: 14,
    fontFamily: "monospace",
    textAlign: "center",
    height: 20,
  },
  progressBarBg: {
    width: "100%",
    height: 6,
    backgroundColor: "#1F2937",
    borderRadius: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  loadingFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
    opacity: 0.6,
  },
  footerText: {
    color: "white",
    fontSize: 12,
    fontFamily: "monospace",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: colors.modalBackgroundPrimary,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    alignItems: "center",
  },
  victoryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.success,
    marginBottom: 12,
  },
  victoryText: {
    fontSize: 16,
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  rewardImage: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  closeBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

