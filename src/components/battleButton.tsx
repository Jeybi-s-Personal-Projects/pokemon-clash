import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const clickSound = require("../../assets/sounds/buttonClick.mp3");

const TYPE_COLORS: Record<string, string> = {
  fire: "#FF6B35",
  water: "#4FC3F7",
  grass: "#66BB6A",
  electric: "#FFD600",
  psychic: "#F06292",
  ice: "#80DEEA",
  dragon: "#7C4DFF",
  dark: "#546E7A",
  normal: "#9E9E9E",
  fighting: "#EF5350",
  poison: "#AB47BC",
  ground: "#FFA726",
  flying: "#80CBC4",
  bug: "#8BC34A",
  rock: "#A1887F",
  ghost: "#5C6BC0",
  steel: "#78909C",
  fairy: "#F48FB1",
};

export default function BattleButton({
  label,
  subLabel,
  description,
  isExpanded,
  moveType,
  effectiveness,
  icon,
  onPress,
  disabled,
  variant = "action",
  width = "48%",
  height = "46%",
}: any) {
  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
    if (onPress) onPress();
  };

  const typeColor = moveType
    ? (TYPE_COLORS[moveType.toLowerCase()] ?? "#9E9E9E")
    : null;

  const accentColor = typeColor ?? (variant === "back" ? "#546E7A" : "#4299b7");

  const getEffectivenessLabel = () => {
    if (effectiveness === 0) return { text: "NO EFFECT", color: "#9E9E9E" };
    if (effectiveness === 0.25)
      return { text: "NOT VERY EFFECTIVE", color: "#4469ef" };
    if (effectiveness === 0.5)
      return { text: "NOT EFFECTIVE", color: "#EF4444" };
    if (effectiveness === 2) return { text: "EFFECTIVE", color: "#22C55E" };
    if (effectiveness === 4)
      return { text: "SUPER EFFECTIVE", color: "#d5ef44" };
    return null;
  };

  const effLabel = getEffectivenessLabel();

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.button,
        {
          width,
          height,
          opacity: disabled ? 0.4 : 1,
          borderColor: accentColor,
          shadowColor: accentColor,
        },
      ]}
    >
      {/* Effectiveness indicator */}
      {effLabel && (
        <View
          style={[
            styles.effBadge,
            {
              backgroundColor: effLabel.color + "44",
              borderColor: effLabel.color,
            },
          ]}
        >
          <Text style={[styles.effText, { color: effLabel.color }]}>
            {effLabel.text}
          </Text>
        </View>
      )}

      {/* Pixel corner accents */}
      <View
        style={[
          styles.corner,
          styles.topLeft,
          { backgroundColor: accentColor },
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.topRight,
          { backgroundColor: accentColor },
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.bottomLeft,
          { backgroundColor: accentColor },
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.bottomRight,
          { backgroundColor: accentColor },
        ]}
      />

      {/* Type badge */}
      {moveType && (
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: accentColor + "33", borderColor: accentColor },
          ]}
        >
          <Text style={[styles.typeText, { color: accentColor }]}>
            {moveType.toUpperCase()}
          </Text>
        </View>
      )}

      {icon && (
        <View
          style={{
            marginBottom: 4,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
      )}
      <Text
        style={[
          styles.label,
          {
            color: disabled ? "#555" : "white",
            fontSize: isExpanded ? 14 : 16,
          },
        ]}
      >
        {label.toUpperCase()}
      </Text>
      {isExpanded && description ? (
        <Text
          style={[styles.description, { color: "#9CA3AF" }]}
          numberOfLines={3}
        >
          {description}
        </Text>
      ) : subLabel ? (
        <Text
          style={[
            styles.subLabel,
            { color: accentColor, fontSize: isExpanded ? 9 : 10 },
          ]}
        >
          {subLabel}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    margin: "1%",
    borderWidth: 1.5,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: "monospace",
    fontWeight: "900",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  subLabel: {
    fontFamily: "monospace",
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  typeBadge: {
    position: "absolute",
    top: 5,
    right: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
  typeText: {
    fontFamily: "monospace",
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  effBadge: {
    position: "absolute",
    top: 5,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
  effText: {
    fontFamily: "monospace",
    fontSize: 6.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  // Pixel corner accents
  corner: {
    position: "absolute",
    width: 10,
    height: 10,
  },
  topLeft: { top: -1, left: -1 },
  topRight: { top: -1, right: -1 },
  bottomLeft: { bottom: -1, left: -1 },
  bottomRight: { bottom: -1, right: -1 },
  description: {
    fontFamily: "monospace",
    fontSize: 7.5,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 4,
    lineHeight: 10,
  },
});
