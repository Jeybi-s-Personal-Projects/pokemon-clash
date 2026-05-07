import React from "react";
import { Modal, Text, TouchableOpacity, View, StyleSheet, ScrollView } from "react-native";
import { ITEMS } from "../../data/items/items";
import { colors } from "../../theme/color";

interface ItemEquipModalProps {
  visible: boolean;
  onSelect: (itemId: string | null) => void;
  onClose: () => void;
}

export function ItemEquipModal({ visible, onSelect, onClose }: ItemEquipModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>CHOOSE ITEM</Text>

          <ScrollView style={styles.list}>
            {Object.values(ITEMS).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemButton}
                onPress={() => onSelect(item.id)}
              >
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.itemButton, styles.unequipButton]}
              onPress={() => onSelect(null)}
            >
              <Text style={styles.unequipText}>UNEQUIP ITEM</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
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
  list: {
    flexGrow: 0,
  },
  itemButton: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  itemName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  itemDesc: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  unequipButton: {
    backgroundColor: "#7F1D1D",
    borderColor: "#991B1B",
  },
  unequipText: {
    color: "#FCA5A5",
    fontWeight: "bold",
    textAlign: "center",
  },
  closeButton: {
    marginTop: 15,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 12,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
