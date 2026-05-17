import { colors } from "@/src/theme/color";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatMoveDescription } from "../utils/battleUtils";
import { TypeBadge, TYPE_COLORS } from "./TypeBadge";


const clickSound = require("../../assets/sounds/buttonClick.mp3");

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
  effects,
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

  const accentColor = typeColor ?? (variant === "back" ? "#ffffff" : "#4299b7");

  const getEffectivenessLabel = () => {
    if (effectiveness === 0) return { text: "X", icon: "close", color: "#9E9E9E" };
    if (effectiveness === 0.25)
      return { text: "0.25X", icon: "chevron-double-down", color: "#4469ef" };
    if (effectiveness === 0.5)
      return { text: "0.5X", icon: "chevron-down", color: "#EF4444" };
    if (effectiveness === 2)
      return { text: "2X", icon: "chevron-up", color: "#22C55E" };
    if (effectiveness === 4)
      return { text: "4X", icon: "chevron-double-up", color: "#d5ef44" };
    return null;
  };

  const effLabel = getEffectivenessLabel();

  const getProcessedDescription = () => {
    return formatMoveDescription(description, { effects });
  };

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
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
            },
          ]}
        >
          <Text style={[styles.effText, { color: "white" }]}>
            {effLabel.text}
          </Text>
          <MaterialCommunityIcons name={effLabel.icon as any} size={10} color="white" />
        </View>
      )}
      {/* Type badge */}
      {!isExpanded && moveType && (
        <View style={styles.typeBadgeContainer}>
          <TypeBadge
            type={moveType}
            size="small"
            borderColor={colors.modalBorderSubtle}
          />
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
      {!isExpanded && (
        <Text
          style={[
            styles.label,
            {
              color: disabled ? "#555" : "white",
              fontSize: 16,
              marginTop: moveType ? 12 : 0,
            },
          ]}
        >
          {label.toUpperCase()}
        </Text>
      )}

      {isExpanded && description ? (
        <Text
          style={[styles.description, { color: "white" }]}
          numberOfLines={3}
        >
          {getProcessedDescription()}
        </Text>
      ) : subLabel ? (
        <Text
          style={[
            styles.subLabel,
            { color: "white", fontSize: isExpanded ? 9 : 10 },
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
    backgroundColor: colors.modalBackgroundPrimary,
    margin: "1%",
    borderWidth: 1.5,
    borderRadius: 10,
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
  typeBadgeContainer: {
    position: "absolute",
    top: 5,
    right: 6,
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
