import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getTypeMultiplier, PokemonType } from "../battle/typeChart";
import { Move } from "../types/pokemon";
import BattleButton from "./battleButton";

type Props = {
  moves: Move[];
  enemyTypes: string[];
  onMovePress: (index: number) => void;
  onBagPress?: () => void;
  onRun?: () => void;
  disabled: boolean;
  currentLog?: string | null;
};

import { FontAwesome5, Ionicons } from "@expo/vector-icons";

const ACTION_CONFIG = [
  {
    label: "Fight",
    icon: <FontAwesome5 name="fist-raised" size={14} color="white" />,
    accent: "#E2C96B",
  },
  {
    label: "Pokémon",
    icon: <Ionicons name="ellipse" size={14} color="white" />,
    accent: "#EF5350",
  },
  {
    label: "Bag",
    icon: <FontAwesome5 name="shopping-bag" size={14} color="white" />,
    accent: "#66BB6A",
  },
  {
    label: "Run",
    icon: <FontAwesome5 name="running" size={14} color="white" />,
    accent: "#4FC3F7",
  },
];

export default function BattleActions({
  moves,
  enemyTypes,
  onMovePress,
  onBagPress,
  onRun,
  disabled,
  currentLog,
}: Props) {
  const [menu, setMenu] = useState<"main" | "fight">("main");
  const [isExpanded, setIsExpanded] = useState(false);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentLog) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      cursorOpacity.setValue(1);
    }
  }, [currentLog]);

  if (currentLog) {
    return (
      <View style={styles.containerText}>
        <View style={styles.logBox}>
          <Text style={styles.logText}>{currentLog}</Text>
          <Animated.View
            style={[styles.cursorArrow, { opacity: cursorOpacity }]}
          />
        </View>
      </View>
    );
  }

  if (menu === "main") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>▶ WHAT WILL</Text>
          <Text style={styles.headerTextBold}>PLAYER DO?</Text>
        </View>
        <View style={styles.grid}>
          {ACTION_CONFIG.map((action) => (
            <BattleButton
              key={action.label}
              label={action.label}
              icon={action.icon}
              onPress={() => {
                if (action.label === "Fight") setMenu("fight");
                else if (action.label === "Bag" && onBagPress) onBagPress();
                else if (action.label === "Run" && onRun) onRun();
              }}
              disabled={disabled}
              variant="action"
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      {/* Expand Toggle */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.expandToggle}
      >
        <Ionicons
          name={isExpanded ? "chevron-down" : "chevron-up"}
          size={18}
          color="#6bdae2"
        />
        <Text style={styles.expandToggleText}>
          {isExpanded ? "HIDE DETAILS" : "SHOW DETAILS"}
        </Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerText}>▶ CHOOSE A</Text>
        <Text style={styles.headerTextBold}>MOVE</Text>
      </View>
      <View style={[styles.grid]}>
        {moves.map((move, i) => {
          const moveType = (move.type || "normal") as PokemonType;
          const effectiveness = getTypeMultiplier(
            moveType,
            enemyTypes as PokemonType[],
          );
          const power = move.power ?? 0;
          const effectiveMove = effectiveness ?? 1;
          const effectivePower = power * effectiveMove;

          return (
            <BattleButton
              key={i}
              label={move.name}
              subLabel={`PWR ${effectivePower} PP ${move.pp ?? 0}/${move.maxPp ?? 0}`}
              description={move.description}
              isExpanded={isExpanded}
              moveType={move.type}
              effectiveness={effectiveness}
              onPress={() => onMovePress(i)}
              disabled={disabled || (move.pp ?? 0) <= 0}
              variant="move"
              height={"40%"}
            />
          );
        })}
        <BattleButton
          label="← Back"
          onPress={() => {
            setMenu("main");
            setIsExpanded(false);
          }}
          disabled={disabled}
          variant="back"
          width="98%"
          height="18%"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 280,
    backgroundColor: "#080B14",
    borderTopWidth: 2,
    borderTopColor: "#6bdae233",
  },
  containerText: {
    width: "100%",
    height: 280,
    backgroundColor: "#080B14",
    borderTopWidth: 2,
    borderTopColor: "#6bdae233",
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
    gap: 6,
  },
  headerText: {
    fontFamily: "monospace",
    fontSize: 9,
    color: "#555",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerTextBold: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#E2C96B",
    fontWeight: "900",
    letterSpacing: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    paddingBottom: 70,
    justifyContent: "space-between",
    alignContent: "space-between",
    flex: 1,
  },
  logContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cursor: {
    width: 12,
    height: 12,
    backgroundColor: "#E2C96B",
    position: "absolute",
    right: 24,
    bottom: 24,
    transform: [{ rotate: "45deg" }],
  },
  logBox: {
    flex: 1,
    margin: 28,
    borderWidth: 2,
    borderColor: "#6bdae244",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  logText: {
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "900",
    color: "#E2C96B",
    letterSpacing: 2,
    lineHeight: 24,
    textTransform: "uppercase",
    textAlign: "center",
  },
  cursorArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#6bdae2",
    alignSelf: "flex-end",
  },
  expandToggle: {
    height: 24,
    width: 120,
    backgroundColor: "#080B14",
    borderWidth: 1.5,
    borderColor: "#6bdae233",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    position: "absolute",
    top: -24,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 10,
  },
  expandToggleText: {
    color: "#6bdae2",
    fontFamily: "monospace",
    fontSize: 8,
    fontWeight: "bold",
  },
});
