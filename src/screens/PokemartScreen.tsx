import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
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

export default function PokemartScreen({ navigation }: PokemartScreenProps) {
  const { user } = useAuth();
  const { stats, refetch: refetchTrainer } = useTrainer(user?.id);
  const { refetch: refetchInventory } = useInventory(user?.id);

  const [buying, setBuying] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    MART_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {}),
  );
  const [confirmItem, setConfirmItem] = useState<{
    item: MartItem;
    quantity: number;
  } | null>(null);

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const getItemSprite = (id: string) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${id}.png`;
  };

  const updateQuantity = (id: string, delta: number) => {
    playClick();
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  const handleBuyPress = (item: MartItem) => {
    const qty = quantities[item.id] || 1;
    const totalPrice = item.price * qty;

    if (!stats || stats.pokecoins < totalPrice) {
      Alert.alert(
        "Insufficient Funds",
        "You don't have enough Pokécoins for this quantity!",
      );
      return;
    }

    playClick();
    setConfirmItem({ item, quantity: qty });
  };

  const confirmPurchase = async () => {
    if (!user || !confirmItem || !stats) return;

    playClick();
    const { item, quantity } = confirmItem;
    const totalPrice = item.price * quantity;

    setBuying(true);
    setConfirmItem(null);

    try {
      // 1. Deduct Pokecoins
      db.runSync(
        `UPDATE trainer_stats SET pokecoins = pokecoins - ? WHERE user_id = ?`,
        [totalPrice, user.id],
      );

      // 2. Add to Inventory
      db.runSync(
        `INSERT INTO inventory (user_id, item_id, quantity) 
         VALUES (?, ?, ?) 
         ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP`,
        [user.id, item.id, quantity, quantity],
      );

      // 3. Refresh Data
      refetchTrainer();
      refetchInventory();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Purchase failed:", error);
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
        renderItem={({ item }) => {
          const qty = quantities[item.id] || 1;
          const totalPrice = item.price * qty;
          const canAfford = !!(stats && stats.pokecoins >= totalPrice);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Image
                  source={{ uri: getItemSprite(item.id) }}
                  style={styles.itemSprite}
                  resizeMode="contain"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, -1)}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, 1)}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionContainer}>
                  <View style={styles.totalContainer}>
                    <Image
                      source={require("../../assets/icons/pokecoin.png")}
                      style={styles.smallCoinIcon}
                    />
                    <Text
                      style={[
                        styles.totalText,
                        !canAfford && styles.insufficientText,
                      ]}
                    >
                      {totalPrice.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.buyButton,
                      !canAfford && styles.buyButtonDisabled,
                    ]}
                    onPress={() => handleBuyPress(item)}
                    disabled={buying || !canAfford}
                  >
                    <Text style={styles.buyButtonText}>BUY</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Confirmation Modal */}
      <Modal
        visible={!!confirmItem}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>
            {confirmItem && (
              <>
                <View style={styles.confirmRow}>
                  <Image
                    source={{ uri: getItemSprite(confirmItem.item.id) }}
                    style={styles.modalSprite}
                  />
                  <Text style={styles.confirmText}>
                    Buy {confirmItem.quantity}x {confirmItem.item.name}?
                  </Text>
                </View>
                <View style={styles.confirmTotal}>
                  <Text style={styles.confirmLabel}>Total Cost:</Text>
                  <View style={styles.coinBadge}>
                    <Image
                      source={require("../../assets/icons/pokecoin.png")}
                      style={styles.coinIcon}
                    />
                    <Text style={styles.confirmPrice}>
                      {(
                        confirmItem.item.price * confirmItem.quantity
                      ).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  playClick();
                  setConfirmItem(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={confirmPurchase}
              >
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.modalBackgroundPrimary,
  },
  header: {
    padding: 16,
    backgroundColor: colors.modalBackgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "flex-end",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.modalBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
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
    backgroundColor: colors.modalBackground,
    padding: 16,
    gap: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: colors.modalContent,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemSprite: {
    width: 50,
    height: 50,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
  },
  itemDesc: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.modalBorderSubtle,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.modalBackground,
    borderRadius: 10,
    padding: 4,
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 20,
    textAlign: "center",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  totalContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  smallCoinIcon: {
    width: 16,
    height: 16,
  },
  totalText: {
    color: "#FACC15",
    fontSize: 16,
    fontWeight: "bold",
  },
  insufficientText: {
    color: colors.danger,
  },
  buyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: colors.modalBackgroundPrimary,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  modalSprite: {
    width: 40,
    height: 40,
  },
  confirmText: {
    fontSize: 18,
    color: "white",
    fontWeight: "500",
  },
  confirmTotal: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.modalContent,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  confirmLabel: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confirmPrice: {
    color: "#FACC15",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "white",
    fontWeight: "bold",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "white",
    fontWeight: "bold",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    backgroundColor: colors.modalContent,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + "22",
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: "bold",
    fontSize: 12,
  },
  tabTextActive: {
    color: colors.accent,
  },
});
