import { colors } from "@/src/theme/color";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MEGA_STONES } from "../data/items/megaStones";
import { MegaRaidScreenProps } from "../types/navigation";

export default function MegaRaidScreen({ navigation }: MegaRaidScreenProps) {
  const [selectedStoneId, setSelectedSelectedStoneId] = useState<string | null>(
    null,
  );

  const formatMegaName = (megaForm: string) => {
    // mega-venusaur -> venusaur-mega
    // mega-charizard-x -> charizard-mega-x
    if (megaForm.startsWith("mega-")) {
      const parts = megaForm.split("-");
      const baseName = parts[1];
      const suffix = parts[2] ? `-${parts[2]}` : "";
      return `${baseName}-mega${suffix}`;
    }
    return megaForm;
  };

  const getMegaImageUrl = (megaForm: string) => {
    const formattedName = formatMegaName(megaForm);
    return `https://img.pokemondb.net/sprites/home/normal/${formattedName}.png`;
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Mega Raids</Text>
        </View>
        <MaterialCommunityIcons
          name="sword-cross"
          size={32}
          color={colors.neonOrange}
        />
      </View>

      <FlatList
        data={MEGA_STONES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const megaForm = item.category.megaForm;
          const megaOf = item.category.megaOf;

          return (
            <TouchableOpacity
              style={[
                styles.card,
                selectedStoneId === item.id && styles.cardSelected,
              ]}
              onPress={() => setSelectedSelectedStoneId(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: getMegaImageUrl(megaForm) }}
                  style={styles.megaImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.megaName}>
                  Mega {megaOf.charAt(0).toUpperCase() + megaOf.slice(1)}
                  {megaForm.endsWith("-x")
                    ? " X"
                    : megaForm.endsWith("-y")
                      ? " Y"
                      : ""}
                </Text>

                <View style={styles.stoneRow}>
                  <MaterialCommunityIcons
                    name="diamond-stone"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={styles.stoneName}>{item.name}</Text>
                </View>

                <Text style={styles.effectText}>{item.category.effect}</Text>
              </View>

              <TouchableOpacity 
                style={styles.battleButton}
                onPress={() => navigation.navigate("MegaRaidBattle", { megaStone: item })}
              >
                <Text style={styles.battleButtonText}>BATTLE</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080c18",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 60,
    paddingTop: 30,
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.modalContent,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    padding: 12,
    alignItems: "center",
    gap: 12,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: "#1e1b4b",
  },
  imageContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#1f2937",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  megaImage: {
    width: 70,
    height: 70,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  megaName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  stoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stoneName: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "600",
  },
  effectText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  battleButton: {
    backgroundColor: colors.neonOrange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  battleButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#080c18",
  },
});
