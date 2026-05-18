import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PokemonSelectionModal } from "../components/battle/PokemonSelectionModal";
import { useAuth } from "../context/AuthContext";
import { InventoryItem, useInventory } from "../hooks/useInventory";
import { colors } from "../theme/color";
import { InventoryBagScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";

const clickSound = require("../../assets/sounds/buttonClick.mp3");

type BagCategory = "pokeballs" | "items" | "battle" | "key";

const TABS: { key: BagCategory; label: string }[] = [
  { key: "pokeballs", label: "Poké Balls" },
  { key: "items", label: "Items" },
  { key: "battle", label: "Battle" },
  { key: "key", label: "Key" },
];

export default function InventoryBagScreen({
  navigation,
  route,
}: InventoryBagScreenProps) {
  const { pokemon, fromScreen, player: playerObj, team, onItemUsed } = route.params as any;
  const [category, setCategory] = useState<BagCategory>("pokeballs");
  const { user } = useAuth();
  const { inventory, loading, consumeItem } = useInventory(user?.id);

  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  const getItemSprite = (id: string) => {
    switch (id) {
      case "poke-ball":
        return require("../../assets/items/pokeball.png");
      case "great-ball":
        return require("../../assets/items/greatball.png");
      case "ultra-ball":
        return require("../../assets/items/ultraball.png");
      case "master-ball":
        return require("../../assets/items/masterball.png");
      default:
        return require("../../assets/items/pokeball.png");
    }
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
  }, [category, inventory]);

  const handleUseItem = (item: InventoryItem) => {
    playClick();
    if (!user) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }

    if (item.category.category === "pokeball") {
      if (fromScreen !== "Battle" && fromScreen !== "EncounterFlow") {
         Alert.alert("Info", "Poké Balls can only be used during an encounter.");
         return;
      }
      // Replace the Bag screen with the dedicated Catching Screen
      navigation.replace("CatchingScreen", {
        player: playerObj,
        team: team,
        enemy: pokemon,
        item: { id: item.id, name: item.name, catchRate: getCatchRate(item) },
        fromScreen: fromScreen,
        onCatchFailed: route.params.onCatchFailed,
        revertMegaInTeam: route.params.revertMegaInTeam,
      });
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
          Alert.alert("Wait!", "You can't use a Potion on a fainted Pokémon. Use a Revive!");
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
           Alert.alert("Wait!", "Use a Revive for fainted Pokémon!");
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
          updatedTeam[targetIndex] = { ...target, hp: Math.floor(target.maxHp / 2), status: null };
          message = `${target.name} was revived!`;
          success = true;
        } else {
          Alert.alert("Wait!", `${target.name} is not fainted.`);
        }
        break;
      case "max-revive":
        if (target.hp <= 0) {
          updatedTeam[targetIndex] = { ...target, hp: target.maxHp, status: null };
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
      
      if (fromScreen === "Battle" && onItemUsed) {
        navigation.goBack();
        // Give battle engine time to receive the team before triggering penalty
        setTimeout(() => {
           onItemUsed(updatedTeam, message);
        }, 100);
      } else {
        Alert.alert("Success", message);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
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

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, gap: 12 }}
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
              source={getItemSprite(item.id)}
              style={styles.ballSprite}
              resizeMode="contain"
            />

            <View style={{ flex: 1 }}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemDesc}>
                {item.description || "No description available."}
              </Text>

              {item.category.category === "pokeball" && (
                <Text style={styles.catchPreview}>
                  Catch Chance: {formatCatchRate(getCatchRate(item))}
                </Text>
              )}
            </View>

            <Text style={styles.useText}>USE</Text>
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
  );
}

function formatCatchRate(rate: number) {
  if (rate === 255) return "Guaranteed";
  if (rate >= 50) return "Very High";
  if (rate >= 25) return "High";
  return "Normal";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.modalBackgroundPrimary,
  },
  tabRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    backgroundColor: colors.modalContent,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    paddingVertical: 10,
    borderRadius: 12,
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.modalContent,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
    padding: 14,
    gap: 12,
  },
  ballSprite: {
    width: 36,
    height: 36,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  itemQuantity: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "bold",
  },
  itemDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  catchPreview: {
    color: colors.accent,
    fontSize: 12,
    marginTop: 6,
    fontWeight: "bold",
  },
  useText: {
    color: colors.accent,
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
