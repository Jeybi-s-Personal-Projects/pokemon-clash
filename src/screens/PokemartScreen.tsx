import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { MART_ITEMS, MartItem } from "../data/pokemart";
import { useInventory } from "../hooks/useInventory";
import { useTrainer } from "../hooks/useTrainer";
import db from "../lib/db";
import { colors } from "../theme/color";
import { PokemartScreenProps } from "../types/navigation";

const clickSound = require("../../assets/sounds/buttonClick.mp3");

export default function PokemartScreen({ navigation }: PokemartScreenProps) {
  const { user } = useAuth();
  const { stats, refetch: refetchTrainer } = useTrainer(user?.id);
  const { refetch: refetchInventory } = useInventory(user?.id);
  const [buying, setBuying] = useState(false);

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  const getItemSprite = (id: string) => {
    switch (id) {
      case "poke-ball": return require("../../assets/items/pokeball.png");
      case "great-ball": return require("../../assets/items/greatball.png");
      case "ultra-ball": return require("../../assets/items/ultraball.png");
      case "master-ball": return require("../../assets/items/masterball.png");
      default: return require("../../assets/items/pokeball.png");
    }
  };

  const handleBuy = async (item: MartItem) => {
    if (!user || !stats) return;
    playClick();

    if (stats.pokecoins < item.price) {
      Alert.alert("Insufficient Funds", "You don't have enough Pokécoins!");
      return;
    }

    setBuying(true);
    try {
      // 1. Deduct Pokecoins
      db.runSync(
        `UPDATE trainer_stats SET pokecoins = pokecoins - ? WHERE user_id = ?`,
        [item.price, user.id]
      );

      // 2. Add to Inventory
      db.runSync(
        `INSERT INTO inventory (user_id, item_id, quantity) 
         VALUES (?, ?, 1) 
         ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + 1, updated_at = CURRENT_TIMESTAMP`,
        [user.id, item.id]
      );

      // 3. Refresh Data
      refetchTrainer();
      refetchInventory();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Purchase failed:", error);
      Alert.alert("Error", "Something went wrong with the purchase.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.balanceContainer}>
          <Image
            source={require("../../assets/icons/pokecoin.png")}
            style={styles.coinIcon}
          />
          <Text style={styles.balanceText}>
            {stats?.pokecoins.toLocaleString() || 0}
          </Text>
        </View>
      </View>

      <FlatList
        data={MART_ITEMS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={getItemSprite(item.id)}
              style={styles.itemSprite}
              resizeMode="contain"
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.priceTag}>
                <Image
                  source={require("../../assets/icons/pokecoin.png")}
                  style={styles.smallCoinIcon}
                />
                <Text style={styles.priceText}>{item.price}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.buyButton,
                stats && stats.pokecoins < item.price && styles.buyButtonDisabled,
              ]}
              onPress={() => handleBuy(item)}
              disabled={buying || (stats && stats.pokecoins < item.price)}
            >
              <Text style={styles.buyButtonText}>BUY</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: 16,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "flex-end",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
    gap: 8,
  },
  coinIcon: {
    width: 20,
    height: 20,
  },
  balanceText: {
    color: "#FACC15",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 12,
  },
  itemSprite: {
    width: 48,
    height: 48,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  itemDesc: {
    color: colors.textMuted,
    fontSize: 12,
  },
  priceTag: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  smallCoinIcon: {
    width: 14,
    height: 14,
  },
  priceText: {
    color: "#FACC15",
    fontSize: 14,
    fontWeight: "bold",
  },
  buyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  buyButtonDisabled: {
    backgroundColor: "#374151",
    opacity: 0.5,
  },
  buyButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
