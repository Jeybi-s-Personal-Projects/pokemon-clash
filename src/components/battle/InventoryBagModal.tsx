import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { InventoryItem, useInventory } from "../../hooks/useInventory";
import { colors } from "../../theme/color";
import { Pokemon } from "../../types/pokemon";
import { PokemonSelectionModal } from "./PokemonSelectionModal";

const clickSound = require("../../../assets/sounds/buttonClick.mp3");

type BagCategory = "pokeballs" | "items" | "battle";

const TABS: { key: BagCategory; label: string; icon: string }[] = [
  { key: "pokeballs", label: "Balls", icon: "pokeball" },
  { key: "items", label: "Medicine", icon: "pill" },
  { key: "battle", label: "Battle", icon: "sword-cross" },
];

interface InventoryBagModalProps {
  visible: boolean;
  onClose: () => void;
  team: Pokemon[];
  enemy: Pokemon;
  onCatchAttempt: (item: {
    id: string;
    name: string;
    catchRate: number;
  }) => void;
  onItemUsed: (updatedTeam: Pokemon[], message: string) => void;
  isMegaRaid?: boolean;
}

export function InventoryBagModal({
  visible,
  onClose,
  team,
  enemy,
  onCatchAttempt,
  onItemUsed,
  isMegaRaid = false,
}: InventoryBagModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { inventory, consumeItem } = useInventory(user?.id);
  const [category, setCategory] = useState<BagCategory>(isMegaRaid ? "items" : "pokeballs");

  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  const getItemSprite = (id: string) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${id}.png`;
  };

  const getCatchRate = (item: InventoryItem) => {
    if (item.category.category !== "pokeball") return 0;
    if (item.id === "poke-ball") return 1;
    if (item.id === "great-ball") return 25;
    if (item.id === "ultra-ball") return 50;
    if (item.id === "master-ball") return 255;
    return 1;
  };

  const data = useMemo(() => {
    if (category === "pokeballs") {
      if (isMegaRaid) return [];
      return inventory.filter((i) => i.category.category === "pokeball");
    }
    if (category === "items") {
      return inventory.filter((i) =>
        ["medicine", "evolution-stone", "berry", "held-item"].includes(
          i.category.category,
        ),
      );
    }
    if (category === "battle") {
      return inventory.filter((i) => i.category.category === "battle-item");
    }
    return [];
  }, [category, inventory, isMegaRaid]);

  const tabs = useMemo(() => {
    return TABS.filter(tab => !(isMegaRaid && tab.key === "pokeballs"));
  }, [isMegaRaid]);

  const handleUseItem = (item: InventoryItem) => {
    playClick();
    if (item.category.category === "pokeball") {
      onCatchAttempt({
        id: item.id,
        name: item.name,
        catchRate: getCatchRate(item),
      });
      onClose();
    } else if (item.category.category === "medicine") {
      setSelectedItem(item);
      setSelectionModalVisible(true);
    } else {
      Alert.alert("Info", `${item.name} cannot be used here.`);
    }
  };

  const applyItemEffect = async (targetIndex: number) => {
    if (!selectedItem || !team) return;
    const target = team[targetIndex];
    let updatedTeam = [...team];
    let message = "";
    let success = false;

    switch (selectedItem.id) {
      case "potion":
        if (target.hp > 0 && target.hp < target.maxHp) {
          const newHp = Math.min(target.maxHp, target.hp + 20);
          updatedTeam[targetIndex] = { ...target, hp: newHp };
          message = `${target.name} recovered 20 HP!`;
          success = true;
        } else if (target.hp <= 0) {
          Alert.alert("Wait!", "Use a Revive for fainted Pokémon!");
        } else {
          Alert.alert("Wait!", `${target.name} is already at full health.`);
        }
        break;
      case "super-potion":
        if (target.hp > 0 && target.hp < target.maxHp) {
          const newHp = Math.min(target.maxHp, target.hp + 50);
          updatedTeam[targetIndex] = { ...target, hp: newHp };
          message = `${target.name} recovered 50 HP!`;
          success = true;
        } else if (target.hp <= 0) {
          Alert.alert("Wait!", "Use a Revive!");
        } else {
          Alert.alert("Wait!", `${target.name} is healthy.`);
        }
        break;
      case "hyper-potion":
        if (target.hp > 0 && target.hp < target.maxHp) {
          const newHp = Math.min(target.maxHp, target.hp + 200);
          updatedTeam[targetIndex] = { ...target, hp: newHp };
          message = `${target.name} recovered 200 HP!`;
          success = true;
        } else if (target.hp <= 0) {
          Alert.alert("Wait!", "Use a Revive!");
        } else {
          Alert.alert("Wait!", `${target.name} is healthy.`);
        }
        break;
      case "max-potion":
        if (target.hp > 0 && target.hp < target.maxHp) {
          updatedTeam[targetIndex] = { ...target, hp: target.maxHp };
          message = `${target.name} was fully healed!`;
          success = true;
        } else if (target.hp <= 0) {
          Alert.alert("Wait!", "Use a Revive!");
        } else {
          Alert.alert("Wait!", `${target.name} is healthy.`);
        }
        break;
      case "revive":
        if (target.hp <= 0) {
          updatedTeam[targetIndex] = {
            ...target,
            hp: Math.floor(target.maxHp / 2),
            status: null,
          };
          message = `${target.name} was revived!`;
          success = true;
        } else {
          Alert.alert("Wait!", `${target.name} is not fainted.`);
        }
        break;
      case "max-revive":
        if (target.hp <= 0) {
          updatedTeam[targetIndex] = {
            ...target,
            hp: target.maxHp,
            status: null,
          };
          message = `${target.name} was fully revived!`;
          success = true;
        } else {
          Alert.alert("Wait!", `${target.name} is not fainted.`);
        }
        break;
    }

    if (success) {
      consumeItem(selectedItem.id, 1);
      setSelectionModalVisible(false);
      onItemUsed(updatedTeam, message);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>INVENTORY BAG</Text>
              <Text style={styles.subtitle}>
                Select an item to use in battle.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close-circle"
                size={32}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  category === tab.key && styles.tabButtonActive,
                ]}
                onPress={() => {
                  playClick();
                  setCategory(tab.key);
                }}
              >
                <MaterialCommunityIcons
                  name={tab.icon as any}
                  size={20}
                  color={category === tab.key ? colors.accent : colors.textMuted}
                />
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
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No items found in this category.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleUseItem(item)}
              >
                <Image
                  source={{ uri: getItemSprite(item.id) }}
                  style={styles.itemSprite}
                  resizeMode="contain"
                />

                <View style={{ flex: 1 }}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  </View>
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.description || "No description available."}
                  </Text>
                </View>

                <View style={styles.useBadge}>
                  <Text style={styles.useText}>USE</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          {selectedItem && (
            <PokemonSelectionModal
              visible={selectionModalVisible}
              title={`Use ${selectedItem.name}`}
              subtitle="Select a Pokémon to apply this item."
              team={team}
              onSelect={applyItemEffect}
              onClose={() => setSelectionModalVisible(false)}
              canCancel={true}
              filter={(p) => {
                if (selectedItem.id.includes("revive")) return p.hp <= 0;
                return p.hp > 0;
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  container: {
    backgroundColor: colors.modalBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "85%",
    minHeight: "60%",
    paddingTop: 24,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    marginTop: -4,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    backgroundColor: colors.modalContent,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tabButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + "15",
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: "bold",
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.accent,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.modalContent,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    padding: 16,
    gap: 14,
  },
  itemSprite: {
    width: 44,
    height: 44,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  itemName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  itemQuantity: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: colors.accent + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemDesc: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  useBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  useText: {
    color: "white",
    fontWeight: "900",
    fontSize: 11,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
