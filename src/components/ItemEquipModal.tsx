import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useInventory } from "../hooks/useInventory";
import { colors } from "../theme/color";
import { isMegaStoneCompatible } from "../utils/megaStoneCompatibility";

interface ItemEquipModalProps {
  visible: boolean;
  speciesId: number;
  onSelect: (itemId: string | null) => void;
  onClose: () => void;
}

type ItemCategory = "berry" | "held-item" | "mega-stone";

const CATEGORIES: { key: ItemCategory; label: string }[] = [
  { key: "berry", label: "Berries" },
  { key: "held-item", label: "Held Items" },
  { key: "mega-stone", label: "Mega Stones" },
];

export function ItemEquipModal({
  visible,
  speciesId,
  onSelect,
  onClose,
}: ItemEquipModalProps) {
  const { user } = useAuth();
  const { inventory } = useInventory(user?.id);
  const [category, setCategory] = useState<ItemCategory>("held-item");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchesCategory = item.category.category === category;
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const isCompatible =
        category !== "mega-stone" || isMegaStoneCompatible(item.id, speciesId);

      return matchesCategory && matchesSearch && isCompatible && item.quantity > 0;
    });
  }, [category, searchQuery, speciesId, inventory]);

  const getItemDescription = (item: any) => {
    return (
      item.description ||
      (item.category as any).effect ||
      (item.category as any).description ||
      ""
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>CHOOSE ITEM</Text>

          {/* Search Bar */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Categories */}
          <View style={styles.tabRow}>
            {CATEGORIES.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  category === tab.key && styles.tabButtonActive,
                ]}
                onPress={() => {
                  setCategory(tab.key);
                  setSearchQuery(""); // Clear search when switching tabs
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    category === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemButton}
                onPress={() => onSelect(item.id)}
              >
                <View style={styles.itemRow}>
                  <Image
                    source={{
                      uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.id}.png`,
                    }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemInfo}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    </View>
                    <Text style={styles.itemDesc}>
                      {getItemDescription(item)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No {category.replace("-", " ")}s found in inventory.</Text>
              </View>
            }
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.unequipButton]}
              onPress={() => onSelect(null)}
            >
              <Text style={styles.unequipText}>UNEQUIP ITEM</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.modalOverlay,
    padding: 15,
  },
  container: {
    backgroundColor: colors.modalBackgroundPrimary,
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.modalBorderSubtle,
    maxHeight: "85%",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: colors.modalBackground,
    color: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    backgroundColor: colors.modalBackground,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonActive: {
    backgroundColor: colors.accent + "22",
    borderColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: "bold",
    fontSize: 10,
  },
  tabTextActive: {
    color: colors.accent,
  },
  itemButton: {
    backgroundColor: colors.modalContent,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  itemQuantity: {
    color: colors.accent,
    fontWeight: "bold",
    fontSize: 14,
  },
  itemDesc: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    height: 60,
    flexDirection: "row",
    paddingTop: 10,
    gap: "4%",
  },
  unequipButton: {
    width: "48%",
    padding: 16,
    backgroundColor: "#7F1D1D",
    borderColor: "#991B1B",
    borderRadius: 10,
  },
  closeButton: {
    width: "48%",
    padding: 16,
    backgroundColor: "#374151",
    borderRadius: 10,
  },
  unequipText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
});
