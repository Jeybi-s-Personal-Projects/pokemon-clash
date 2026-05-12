import { colors } from "@/src/theme/color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pokemon } from "../../types/pokemon";
import { getPokemonIcon } from "../../utils/pokemonImageUtils";

interface SwitchModalProps {
  visible: boolean;
  team: Pokemon[];
  activeIndex: number;
  onSwitch: (index: number) => void;
  onClose: () => void;
  canCancel: boolean;
}

export const SwitchModal = ({
  visible,
  team,
  activeIndex,
  onSwitch,
  onClose,
  canCancel,
}: SwitchModalProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Choose a Pokémon:</Text>
              {!canCancel && (
                <Text style={styles.subtitle}>Your Pokémon fainted! Switch now.</Text>
              )}
            </View>
            {canCancel && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={team}
            keyExtractor={(p, i) => i.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const isCurrent = index === activeIndex;
              const isFainted = item.hp <= 0;

              return (
                <TouchableOpacity
                  onPress={() => onSwitch(index)}
                  disabled={isCurrent || isFainted}
                  style={[
                    styles.item,
                    isCurrent && styles.currentItem,
                    isFainted && styles.fainted,
                  ]}
                >
                  <Image
                    source={{ uri: getPokemonIcon(item.speciesId) }}
                    style={styles.pokemonIcon}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{item.name}</Text>
                      {isCurrent && <Text style={styles.onFieldLabel}>ON FIELD</Text>}
                    </View>
                    <View style={styles.statsRow}>
                      <Text style={styles.level}>Lv. {item.level}</Text>
                      <View style={styles.hpBarBg}>
                        <View
                          style={[
                            styles.hpBarFill,
                            {
                              width: `${(item.hp / item.maxHp) * 100}%`,
                              backgroundColor:
                                item.hp / item.maxHp > 0.5
                                  ? "#22c55e"
                                  : item.hp / item.maxHp > 0.2
                                    ? "#f59e0b"
                                    : "#ef4444",
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.hpText}>
                        {Math.ceil(item.hp)}/{item.maxHp}
                      </Text>
                    </View>
                  </View>
                  {isFainted && <Text style={styles.fntLabel}>FNT</Text>}
                </TouchableOpacity>
              );
            }}
          />
          {canCancel && (
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  container: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "85%",
    minHeight: "40%",
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#374151",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#EF4444",
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 10,
  },
  item: {
    backgroundColor: "#1F2937",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 16,
    marginBottom: 12,
  },
  currentItem: {
    borderColor: "#818CF8",
    backgroundColor: "#1e1b4b",
  },
  pokemonIcon: {
    width: 44,
    height: 44,
    marginRight: 12,
  },
  fainted: {
    opacity: 0.6,
    backgroundColor: "#111827",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  onFieldLabel: {
    color: "#818CF8",
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "#312e81",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  level: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  hpBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 3,
    overflow: "hidden",
  },
  hpBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  hpText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "500",
    minWidth: 45,
    textAlign: "right",
  },
  fntLabel: {
    color: "#EF4444",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },
  cancelButton: {
    marginTop: 8,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1F2937",
  },
  cancelText: {
    color: "#D1D5DB",
    fontWeight: "bold",
    fontSize: 16,
  },
});
