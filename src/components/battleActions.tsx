import { BATTLE_MOVES } from "@/src/data/pokemon/moves/movesBattle";
import { colors } from "@/src/theme/color";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
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
  onMegaEvolve?: () => void;
  canMegaEvolve?: boolean;
  isEnemyShiny?: boolean;
  defeatCount?: number;
  isMegaRaid?: boolean;
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
  onMegaEvolve,
  canMegaEvolve,
  isEnemyShiny,
  defeatCount,
  isMegaRaid = false,
}: Props) {
  const [menu, setMenu] = useState<"main" | "fight">("main");
  const [isExpanded, setIsExpanded] = useState(false);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  const findBestMoveIndex = (): number => {
    let bestIndex = -1;
    let maxScore = -1;

    moves.forEach((move, i) => {
      // 1. Skip if no PP
      if ((move.pp ?? 0) <= 0) return;

      let score = 0;
      const power = move.power ?? 0;
      const moveType = (move.type || "normal") as PokemonType;

      // 2. Damage-based scoring
      if (power > 0) {
        const effectiveness =
          getTypeMultiplier(moveType, enemyTypes as PokemonType[]) ?? 1;
        const stab = playerTypes.includes(moveType) ? 1.5 : 1;
        score = power * effectiveness * stab;
      } else {
        // 3. Status/Utility move scoring (fallback)
        // Give base utility score to non-damage moves
        score = 50;
      }

      if (score > maxScore) {
        maxScore = score;
        bestIndex = i;
      }
    });

    return bestIndex;
  };

  useEffect(() => {
    if (isAutoBattle && !disabled && !currentLog) {
      if (isEnemyShiny) {
        onToggleAutoBattle?.(false);
        return;
      }
      const bestIdx = findBestMoveIndex();
      if (bestIdx !== -1) {
        const timer = setTimeout(() => {
          onMovePress(bestIdx);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isAutoBattle, disabled, currentLog, isEnemyShiny]);

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
        {!isMegaRaid && (
          <View
            style={{
              height: 24,
              paddingHorizontal: 10,
              backgroundColor: "#080B14",
              borderWidth: 1,
              borderColor: isAutoBattle ? colors.neonOrange : colors.neonBlue,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: isAutoBattle ? colors.neonOrange : colors.neonBlue,
                fontFamily: "monospace",
                fontSize: 8,
                fontWeight: "bold",
              }}
            >
              STREAK: {defeatCount}
            </Text>
          </View>
        )}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginLeft: isMegaRaid ? "auto" : 0,
          }}
        >
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
          {canMegaEvolve && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onMegaEvolve}
              disabled={disabled}
              style={[
                styles.toggleButton,
                {
                  borderColor: isAutoBattle
                    ? colors.neonOrange
                    : colors.neonBlue,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <Image
                source={require("@/assets/icons/mega-evolution-icon.png")}
                style={{ width: 14, height: 14, opacity: disabled ? 0.5 : 1 }}
              />
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: isAutoBattle ? colors.neonOrange : colors.neonBlue,
                    opacity: disabled ? 0.5 : 1,
                  },
                ]}
              >
                MEGA
              </Text>
            </TouchableOpacity>
          )}
          {!isMegaRaid && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onToggleAutoBattle?.(!isAutoBattle)}
              style={[
                styles.toggleButton,
                {
                  borderColor: isAutoBattle
                    ? colors.neonOrange
                    : colors.neonBlue,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isAutoBattle ? "pause-circle" : "play-circle-outline"}
                size={12}
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
          )}
        </View>
      </View>

      {currentLog ? (
        <View style={[styles.logBox]}>
          <View style={styles.logDesign}>
            <MaterialCommunityIcons name="pokeball" size={160} color="white" />
          </View>
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
                  subLabel={`PWR ${move.power ?? 0} PP ${move.pp ?? 0}/${move.maxPp ?? 0}`}
                  description={move.description}
                  isExpanded={isExpanded}
                  moveType={move.type}
                  effectiveness={effectiveness}
                  effects={move.effects}
                  onPress={() => onMovePress(i)}
                  disabled={
                    disabled ||
                    (move.pp ?? 0) <= 0 ||
                    BATTLE_MOVES[move.name.toLowerCase()]?.category === "unique"
                  }
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
    backgroundColor: colors.modalContent,

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
    color: "white",
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
    backgroundColor: colors.modalBackgroundPrimary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  logDesign: {
    position: "absolute",
    opacity: 0.15,
    top: 0,
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
    justifyContent: "space-between",
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
