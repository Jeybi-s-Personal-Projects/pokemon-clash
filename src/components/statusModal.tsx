import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/color";

interface Props {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export default function StatusModal({
  visible,
  message,
  type = "info",
  onClose,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text
            style={[
              styles.title,
              type === "success" && { color: colors.success },
              type === "error" && { color: colors.danger },
              type === "info" && { color: colors.accent },
            ]}
          >
            {type.toUpperCase()}
          </Text>

          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "80%",
    backgroundColor: colors.modalBackgroundPrimary,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  message: {
    textAlign: "center",
    marginBottom: 24,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
