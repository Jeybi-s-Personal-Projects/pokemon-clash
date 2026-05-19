import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../theme/color";
import { TYPE_COLORS, TypeBadge } from "../TypeBadge";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface TeraSelectionModalProps {
  visible: boolean;
  onSelect: (type: string) => void;
  onClose: () => void;
}

const ALL_TYPES = Object.keys(TYPE_COLORS);

export const TeraSelectionModal = ({
  visible,
  onSelect,
  onClose,
}: TeraSelectionModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="crystal-ball" size={24} color={colors.neonBlue} />
            <Text style={styles.title}>CHOOSE TERA TYPE</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>
            Select the elemental type your Pokémon will transform into.
          </Text>

          <FlatList
            data={ALL_TYPES}
            numColumns={3}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.typeItem}
                onPress={() => onSelect(item)}
              >
                <TypeBadge type={item} size="normal" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    backgroundColor: colors.modalBackground,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  title: {
    flex: 1,
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  listContent: {
    gap: 12,
  },
  typeItem: {
    flex: 1,
    margin: 4,
    alignItems: "center",
  },
});
