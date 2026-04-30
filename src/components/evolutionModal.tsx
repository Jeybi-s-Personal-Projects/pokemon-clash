import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated } from "react-native";
type Props = {
  visible: boolean;
  pokemon: { oldName: string; newSpeciesId: number; newName: string; spriteUrl: string } | null;
  onClose: () => void;
};

import { Image } from "react-native";

export default function EvolutionModal({ visible, pokemon, onClose }: Props) {
  if (!pokemon) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Evolution!</Text>
          <Text style={styles.message}>
            {pokemon.oldName.toUpperCase()} is evolving...
          </Text>
          <View style={styles.spriteContainer}>
            <Image
              source={{ uri: pokemon.spriteUrl }}
              style={styles.sprite}
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContent: {
    backgroundColor: "#1F2937",
    padding: 24,
    borderRadius: 15,
    alignItems: "center",
    width: "80%",
  },
  title: {
    color: "#E2C96B",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    color: "white",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  spriteContainer: {
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  sprite: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  button: {
    backgroundColor: "#818cf8",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

