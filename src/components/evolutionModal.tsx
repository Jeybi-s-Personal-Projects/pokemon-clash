import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../theme/color";

type Props = {
  visible: boolean;
  pokemon: {
    oldName: string;
    newSpeciesId: number;
    newName: string;
    spriteUrl: string;
    oldSpriteUrl?: string; // Optional: Add this if you can pass the old sprite
  } | null;
  onClose: () => void;
};

export default function EvolutionModal({ visible, pokemon, onClose }: Props) {
  if (!pokemon) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="pokeball" size={24} color="#facc15" />
            <Text style={styles.title}>EVOLUTION!</Text>
          </View>

          <Text style={styles.message}>
            <Text style={styles.oldName}>{pokemon.oldName.toUpperCase()}</Text>
            {" evolved into "}
            <Text style={styles.newName}>{pokemon.newName.toUpperCase()}</Text>
            {"!"}
          </Text>

          <View style={styles.spriteContainer}>
            <Image
              source={{ uri: pokemon.spriteUrl }}
              style={styles.newSprite}
            />
          </View>

          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Continue</Text>
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
    alignItems: "center",
    backgroundColor: colors.modalOverlay,
    padding: 20,
  },
  container: {
    backgroundColor: colors.modalBackgroundPrimary,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    width: "100%",
    borderWidth: 2,
    borderColor: colors.modalBorder,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
  },
  title: {
    color: "#facc15",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  message: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  oldName: {
    color: "#9CA3AF",
    fontWeight: "bold",
  },
  newName: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  spriteContainer: {
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  newSprite: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.modalBorderSubtle,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
