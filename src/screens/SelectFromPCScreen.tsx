import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { colors } from "../theme/color";
import { Pokemon } from "../types/pokemon";

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

export default function SelectFromPCScreen({ route, navigation }: any) {
  const { currentTeamIds } = route.params;
  const { user } = useAuth();
  const [pcPokemon, setPcPokemon] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  useEffect(() => {
    fetchPC();
  }, []);

  const fetchPC = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pokemon")
        .select("id, pk_name, pk_level, pk_front_image, pk_types")
        .eq("user_id", user.id)
        .is("pk_order", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPcPokemon(data || []);
    } catch (e) {
      console.error("Error fetching PC:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (p: any) => {
    if (isProcessing) return;
    playClick();
    setIsProcessing(true);

    try {
      // Find the next available order index
      const { count } = await supabase
        .from("pokemon")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .not("pk_order", "is", null);

      const nextOrder = (count || 0) + 1;

      const { error } = await supabase
        .from("pokemon")
        .update({ pk_order: nextOrder })
        .eq("id", p.id);

      if (error) throw error;

      // Successfully added to team
      navigation.goBack();
    } catch (e) {
      console.error("Error adding to team:", e);
      setIsProcessing(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const primaryType = item.pk_types[0];
    const accentColor = TYPE_COLORS[primaryType] ?? "#888";

    return (
      <TouchableOpacity
        style={[styles.card, { borderColor: accentColor + "44" }]}
        onPress={() => handleSelect(item)}
        disabled={isProcessing}
      >
        <Image
          source={{ uri: item.pk_front_image }}
          style={styles.sprite}
          resizeMode="contain"
        />
        <Text style={styles.name}>{item.pk_name}</Text>
        <Text style={styles.level}>Lv. {item.pk_level}</Text>

        <View style={styles.typeRow}>
          {item.pk_types.map((t: string) => (
            <View
              key={t}
              style={[
                styles.typeBadge,
                { backgroundColor: (TYPE_COLORS[t] ?? "#888") + "33" },
              ]}
            >
              <Text style={[styles.typeText, { color: TYPE_COLORS[t] ?? "#888" }]}>
                {t}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select from PC</Text>
        <Text style={styles.subtitle}>
          Choose a Pokémon to add to your team.
        </Text>
      </View>

      {pcPokemon.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="briefcase-outline" size={64} color="#374151" />
          <Text style={styles.emptyText}>Your PC is empty.</Text>
        </View>
      ) : (
        <FlatList
          data={pcPokemon}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {isProcessing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: 20,
    backgroundColor: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  list: {
    padding: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  sprite: {
    width: 80,
    height: 80,
  },
  name: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "capitalize",
    marginTop: 4,
  },
  level: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  typeRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  emptyText: {
    color: "#9CA3AF",
    marginTop: 12,
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
});
