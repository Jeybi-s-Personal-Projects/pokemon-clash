import { colors } from "@/src/theme/color";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  playerTypes: string[];
  enemyTypes: string[];
  onMovePress: (index: number) => void;
  onPokemonPress?: () => void;
  onBagPress?: () => void;
  onRun?: () => void;
  disabled: boolean;
  currentLog?: string | null;
  isAutoBattle?: boolean;
  onToggleAutoBattle?: (value: boolean) => void;
};

const ACTION_CONFIG = [
  {
    label: "Fight",
    icon: <MaterialCommunityIcons name="sword-cross" size={18} color="white" />,
    accent: "#E2C96B",
  },
  {
    label: "Pokémon",
    icon: <MaterialCommunityIcons name="pokeball" size={18} color="white" />,
    accent: "#EF5350",
  },
  {
    label: "Bag",
    icon: (
      <MaterialCommunityIcons name="bag-personal" size={18} color="white" />
    ),
    accent: "#66BB6A",
  },
  {
    label: "Run",
    icon: <MaterialCommunityIcons name="run" size={18} color="white" />,
    accent: "#4FC3F7",
  },
];

export default function BattleActions({
  moves,
  playerTypes,
  enemyTypes,
  onMovePress,
  onPokemonPress,
  onBagPress,
  onRun,
  disabled,
  currentLog,
  isAutoBattle = false,
  onToggleAutoBattle,
}: Props) {
  const [menu, setMenu] = useState<"main" | "fight">("main");
  const [isExpanded, setIsExpanded] = useState(false);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  const findBestMoveIndex = () => {
    let bestIndex = -1;
    let maxEffectivePower = -1;

    moves.forEach((move, i) => {
      if ((move.pp ?? 0) <= 0) return;

      const power = move.power ?? 0;
      if (power === 0) return;

      const moveType = (move.type || "normal") as PokemonType;
      const effectiveness = getTypeMultiplier(
        moveType,
        enemyTypes as PokemonType[],
      );

      // STAB: Same Type Attack Bonus (1.5x)
      const stab = playerTypes.includes(moveType) ? 1.5 : 1;
      const effectivePower = power * (effectiveness ?? 1) * stab;

      if (effectivePower > maxEffectivePower) {
        maxEffectivePower = effectivePower;
        bestIndex = i;
      }
    });

    if (bestIndex === -1) {
      let maxPP = -1;
      moves.forEach((move, i) => {
        if ((move.pp ?? 0) > maxPP) {
          maxPP = move.pp ?? 0;
          bestIndex = i;
        }
      });
    }

    return bestIndex;
  };

  useEffect(() => {
    if (isAutoBattle && !disabled && !currentLog) {
      const bestIdx = findBestMoveIndex();
      if (bestIdx !== -1) {
        const timer = setTimeout(() => {
          onMovePress(bestIdx);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isAutoBattle, disabled, currentLog]);

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

  return (
    <View
      style={[
        currentLog ? styles.containerText : styles.container,
        { borderTopColor: isAutoBattle ? colors.neonOrange : colors.neonBlue },
      ]}
    >
      <View style={styles.toggleRow}>
        {menu === "fight" && !currentLog && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.toggleButton}
          >
            <Ionicons
              name={isExpanded ? "chevron-down" : "chevron-up"}
              size={16}
              color={colors.neonBlue}
            />
            <Text style={styles.toggleText}>
              {isExpanded ? "HIDE DETAILS" : "SHOW DETAILS"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onToggleAutoBattle?.(!isAutoBattle)}
          style={[
            styles.toggleButton,
            { borderColor: isAutoBattle ? colors.neonOrange : colors.neonBlue },
          ]}
        >
          <MaterialCommunityIcons
            name={isAutoBattle ? "pause-circle" : "play-circle-outline"}
            size={16}
            color={isAutoBattle ? colors.neonOrange : colors.neonBlue}
          />
          <Text
            style={[
              styles.toggleText,
              { color: isAutoBattle ? colors.neonOrange : colors.neonBlue },
            ]}
          >
            {isAutoBattle ? "MANUAL BATTLE" : "AUTO BATTLE"}
          </Text>
        </TouchableOpacity>
      </View>

      {currentLog ? (
        <View style={[styles.logBox]}>
          <Text style={styles.logText}>{currentLog}</Text>
          <Animated.View
            style={[styles.cursorArrow, { opacity: cursorOpacity }]}
          />
        </View>
      ) : menu === "main" ? (
        <>
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
                  else if (action.label === "Pokémon") onPokemonPress?.();
                  else if (action.label === "Bag") onBagPress?.();
                  else if (action.label === "Run") onRun?.();
                }}
                disabled={disabled && action.label !== "Run"}
                variant="action"
              />
            ))}
          </View>
        </>
      ) : (
        <>
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
              const effectivePower = power * (effectiveness ?? 1);

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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 280,
    backgroundColor: "#080B14",
    borderTopWidth: 1,
  },
  containerText: {
    width: "100%",
    height: 280,
    backgroundColor: "#080B14",
    borderTopWidth: 2,
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
  logBox: {
    flex: 1,
    margin: 40,
    borderWidth: 2,
    borderColor: colors.neonBlue,
    backgroundColor: colors.bgButtonStandard,
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
    borderTopColor: colors.neonBlue,
    alignSelf: "flex-end",
  },
  toggleRow: {
    flexDirection: "row",
    position: "absolute",
    top: -24,
    left: 10,
    right: 10,
    justifyContent: "flex-end",
    gap: 8,
    zIndex: 10,
  },
  toggleButton: {
    height: 24,
    paddingHorizontal: 10,
    backgroundColor: "#080B14",
    borderWidth: 1,
    borderColor: colors.neonBlue,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  toggleText: {
    color: colors.neonBlue,
    fontFamily: "monospace",
    fontSize: 8,
    fontWeight: "bold",
  },
});
