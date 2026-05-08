import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export const TYPE_COLORS: Record<string, string> = {
  fire: "#ff6b35",
  water: "#4FC3F7",
  grass: "#66BB6A",
  electric: "#FFD54F",
  psychic: "#F48FB1",
  ice: "#80deea",
  dragon: "#7986CB",
  dark: "#616161",
  fairy: "#F06292",
  normal: "#BDBDBD",
  fighting: "#EF5350",
  flying: "#90CAF9",
  poison: "#AB47BC",
  ground: "#D4A574",
  rock: "#8D6E63",
  bug: "#AED581",
  ghost: "#7E57C2",
  steel: "#78909C",
};

const TYPE_ICONS: Record<string, any> = {
  bug: require("../../assets/icons/types/bug.png"),
  dark: require("../../assets/icons/types/dark.png"),
  dragon: require("../../assets/icons/types/dragon.png"),
  electric: require("../../assets/icons/types/electric.png"),
  fairy: require("../../assets/icons/types/fairy.png"),
  fighting: require("../../assets/icons/types/fighting.png"),
  fire: require("../../assets/icons/types/fire.png"),
  flying: require("../../assets/icons/types/flying.png"),
  ghost: require("../../assets/icons/types/ghost.png"),
  grass: require("../../assets/icons/types/grass.png"),
  ground: require("../../assets/icons/types/ground.png"),
  ice: require("../../assets/icons/types/ice.png"),
  normal: require("../../assets/icons/types/normal.png"),
  poison: require("../../assets/icons/types/poison.png"),
  psychic: require("../../assets/icons/types/psychic.png"),
  rock: require("../../assets/icons/types/rock.png"),
  steel: require("../../assets/icons/types/steel.png"),
  water: require("../../assets/icons/types/water.png"),
};

interface TypeBadgeProps {
  type: string;
  size?: 'small' | 'normal';
  borderColor?: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, size = 'normal', borderColor }) => {
  const color = TYPE_COLORS[type.toLowerCase()] ?? "#888";
  const icon = TYPE_ICONS[type.toLowerCase()];

  const isSmall = size === 'small';

  return (
    <View style={[
        styles.badge, 
        { 
          backgroundColor: color + "33", 
          paddingHorizontal: isSmall ? 6 : 8, 
          paddingVertical: isSmall ? 2 : 4,
          borderWidth: borderColor ? 1 : 0,
          borderColor: borderColor || 'transparent'
        }
    ]}>
      {icon && <Image source={icon} style={[styles.icon, { width: isSmall ? 10 : 12, height: isSmall ? 10 : 12 }]} />}
      <Text style={[styles.badgeText, { color, fontSize: isSmall ? 8 : 10 }]}>{type}</Text>
    </View>
  );
};


const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  icon: {
    width: 12,
    height: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "white",
  },
});
