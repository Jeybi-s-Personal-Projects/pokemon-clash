import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getTypeMultiplier, PokemonType } from "../battle/typeChart";
import BattleButton from "./battleButton";

type Move = {
  name: string;
  power: number;
  type?: string;
  pp?: number;
  maxPp?: number;
};

type Props = {
  moves: Move[];
  enemyTypes: string[];
  onMovePress: (index: number) => void;
  onBagPress?: () => void;
  onRun?: () => void;
  disabled: boolean;
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
}: Props) {
  const [menu, setMenu] = useState<"main" | "fight">("main");

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>▶ CHOOSE A</Text>
        <Text style={styles.headerTextBold}>MOVE</Text>
      </View>
      <View style={styles.grid}>
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
              // subLabel={`PWR ${move.power}  PP ${move.pp ?? "—"}/${move.maxPp ?? "—"}`}
              subLabel={`PWR ${effectivePower} PP ${move.pp ?? "—"}/${move.maxPp ?? "—"}`}
              moveType={move.type}
              effectiveness={effectiveness}
              onPress={() => onMovePress(i)}
              disabled={disabled}
              variant="move"
              height="40%"
            />
          );
        })}
        <BattleButton
          label="← Back"
          onPress={() => setMenu("main")}
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
});
