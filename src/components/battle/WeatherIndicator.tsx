import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WeatherCondition } from "../../battle/battleTypes";

interface WeatherIndicatorProps {
  weather: WeatherCondition;
  turns: number;
}

const WEATHER_CONFIG = {
  rain: {
    icon: "weather-pouring",
    color: "#60A5FA",
    label: "RAIN",
    bg: "rgba(96, 165, 250, 0.2)",
  },
  sun: {
    icon: "weather-sunny",
    color: "#FBBF24",
    label: "SUN",
    bg: "rgba(251, 191, 36, 0.2)",
  },
  sandstorm: {
    icon: "weather-dust",
    color: "#D4A574",
    label: "SAND",
    bg: "rgba(212, 165, 116, 0.2)",
  },
  hail: {
    icon: "weather-snowy-heavy",
    color: "#93C5FD",
    label: "HAIL",
    bg: "rgba(147, 197, 253, 0.2)",
  },
};

export const WeatherIndicator = ({ weather, turns }: WeatherIndicatorProps) => {
  if (!weather || turns <= 0) return null;

  const config = WEATHER_CONFIG[weather];

  return (
    <View style={[styles.container, { borderColor: config.color, backgroundColor: config.bg }]}>
      <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      <View style={[styles.turnBadge, { backgroundColor: config.color }]}>
        <Text style={styles.turnText}>{turns}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 10,
    top: "40%",
    transform: [{ translateY: -40 }],
    width: 50,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 10,
  },
  label: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  turnBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  turnText: {
    color: "#1F2937",
    fontSize: 10,
    fontWeight: "bold",
  },
});
