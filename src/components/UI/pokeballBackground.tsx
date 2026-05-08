// components/ui/PokeballBackground.tsx
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");

type Props = {
  children?: React.ReactNode;
  bgColor?: string;
  iconColor?: string;
  iconOpacity?: number;
  size?: number;
  spacing?: number;
};

export default function PokeballBackground({
  children,
  bgColor = "#0f172a",
  iconColor = "#ffffff",
  iconOpacity = 0.05,
  size = 40,
  spacing = 20,
}: Props) {
  const itemSize = size + spacing;

  const columns = Math.ceil(width / itemSize);
  const rows = Math.ceil(height / itemSize);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Icon Grid */}
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: rows }).map((_, row) => (
          <View key={row} style={{ flexDirection: "row" }}>
            {Array.from({ length: columns }).map((_, col) => (
              <MaterialCommunityIcons
                key={col}
                name="pokeball"
                size={size}
                color={iconColor}
                style={{
                  opacity: iconOpacity,
                  marginRight: spacing,
                  marginBottom: spacing,
                }}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Content on top */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
