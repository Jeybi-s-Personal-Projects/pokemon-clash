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
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose a Pokémon:</Text>
            {canCancel && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={team}
            keyExtractor={(p, i) => i.toString()}
            renderItem={({ item, index }) => {
              const isCurrent = index === activeIndex;
              const isFainted = item.hp <= 0;

              return (
                <TouchableOpacity
                  onPress={() => onSwitch(index)}
                  disabled={isCurrent || isFainted}
                  style={[styles.item, isFainted && styles.fainted]}
                >
                  <Image
                    source={{ uri: getPokemonIcon(item.speciesId) }}
                    style={styles.pokemonIcon}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>
                      {item.name} {isCurrent && "(On Field)"}
                    </Text>
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
              <Text style={styles.cancelText}>Cancel</Text>
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
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  container: {
    backgroundColor: "#1d2633",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingVertical: 4,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  item: {
    backgroundColor: "#253956",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderWidth: 1,
    borderColor: "#ffffff80",
    borderRadius: 10,
    gap: 12,
    marginBottom: 8,
  },
  pokemonIcon: {
    width: 40,
    height: 40,
    marginRight: 14,
  },
  fainted: {
    opacity: 0.5,
  },
  name: {
    color: "white",
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  level: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  hpBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
  },
  hpBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  hpText: {
    color: "white",
    fontSize: 12,
  },
  fntLabel: {
    color: "#EF4444",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    color: "#9CA3AF",
  },
});
