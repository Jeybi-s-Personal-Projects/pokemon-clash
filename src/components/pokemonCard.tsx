import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Image, Text, View } from "react-native";
import { StatStages } from "../battle/battleTypes";
import { Pokemon } from "../types/pokemon";
import ExpBar from "./expBar";
import HpBar from "./hpBar";

type Props = {
  pokemon: Pokemon;
  isBack?: boolean;
  isAttacking?: boolean;
  isDancing?: boolean;
  isHit?: boolean;
  isEntering?: boolean;
  stages?: StatStages;
  exp?: number;
  maxExp?: number;
};

const getStatMultiplier = (stage: number) => {
  if (stage >= 0) return (2 + stage) / 2;
  return 2 / (2 + Math.abs(stage));
};

const StatIndicator = ({ label, stage }: { label: string; stage: number }) => {
  if (stage === 0) return null;
  const multiplier = getStatMultiplier(stage);
  const formattedMultiplier = parseFloat(multiplier.toFixed(2));
  const color = stage > 0 ? "#60A5FA" : "#F87171"; // Blue for buff, Red for debuff

  return (
    <View
      style={{
        backgroundColor: color + "22",
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: color + "44",
        marginRight: 3,
      }}
    >
      <Text style={{ fontSize: 7, fontWeight: "bold", color: color }}>
        {label} {formattedMultiplier}x
      </Text>
    </View>
  );
};

export default function PokemonCard({
  pokemon,
  isBack,
  isAttacking,
  isDancing,
  isHit,
  isEntering,
  stages,
  exp,
  maxExp,
}: Props) {
  const imageSource = isBack ? pokemon.backImage : pokemon.frontImage;

  // Animation values
  const moveAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAttacking) {
      // Normal attack: Move toward opponent
      Animated.sequence([
        Animated.timing(moveAnim, {
          toValue: isBack ? -50 : 50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(moveAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAttacking]);

  useEffect(() => {
    if (isDancing) {
      // Dance animation: Move side to side
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 20,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -20,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 20,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDancing]);

  useEffect(() => {
    if (isHit) {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 30,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -30,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isHit]);

  const opacityAnim = useRef(new Animated.Value(1)).current;
  const isFading = useRef(false);

  // Separate effect to handle entering animation
  useEffect(() => {
    if (isEntering) {
      opacityAnim.setValue(0);
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      opacityAnim.setValue(1);
    }
  }, [isEntering, pokemon.id]);

  useEffect(() => {
    if (pokemon.hp <= 0) {
      if (isFading.current) return;
      isFading.current = true;

      const delay = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          isFading.current = false;
        });
      }, 600);

      return () => clearTimeout(delay);
    } else {
      if (!isFading.current && !isEntering) {
        opacityAnim.setValue(1);
      }
    }
  }, [pokemon.hp, isEntering]);

  return (
    <View
      style={{
        alignItems: isBack ? "flex-start" : "flex-end",
        width: "100%",
        height: 140, // Reduced from 180
        justifyContent: "center",
      }}
    >
      {/* Static Info Box */}
      <View
        style={{
          padding: 8,
          width: isBack ? "40%" : "50%",
          zIndex: 1,
          position: "absolute",
          top: isBack ? -20 : 0, // Adjusted top
          [isBack ? "right" : "left"]: 10,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>
            {pokemon.name.toUpperCase()}
            {pokemon.isShiny && (
              <View>
                <Ionicons
                  name="star"
                  size={12}
                  color="#facc15"
                  style={{ marginLeft: 5 }}
                />
              </View>
            )}{" "}
          </Text>

          <Text style={{ fontSize: 14, color: "white" }}>
            lvl {pokemon.level}
          </Text>
        </View>

        <HpBar hp={pokemon.hp} maxHp={pokemon.maxHp} hideRatio />

        {/* Row: HP ratio + EXP bar (player) OR HP ratio + stat stages (enemy) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: isBack ? "flex-end" : "flex-start",
            marginTop: -3,
          }}
        >
          {/* Player: HP ratio then EXP bar */}
          {isBack && (
            <Text style={{ color: "white", fontSize: 10, marginRight: 6 }}>
              {Math.round(pokemon.hp)} / {pokemon.maxHp}
            </Text>
          )}

          {isBack && exp !== undefined && maxExp !== undefined && (
            <View style={{ flex: 1 }}>
              <ExpBar exp={exp} maxExp={maxExp} />
            </View>
          )}

          {/* Enemy: stat stages then HP ratio */}
          {!isBack && stages && (
            <View
              style={{
                flexDirection: "row-reverse",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                flex: 1,
              }}
            >
              <StatIndicator label="ATK" stage={stages.attack} />
              <StatIndicator label="DEF" stage={stages.defense} />
              <StatIndicator label="SP.A" stage={stages.specialAttack} />
              <StatIndicator label="SP.D" stage={stages.specialDefense} />
              <StatIndicator label="SPD" stage={stages.speed} />
            </View>
          )}

          {!isBack && (
            <Text style={{ color: "white", fontSize: 10, marginLeft: 8 }}>
              {Math.round(pokemon.hp)} / {pokemon.maxHp}
            </Text>
          )}
        </View>

        {/* Row: stat stages for player only — below the HP+EXP row */}
        {isBack && stages && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "flex-start",
              marginTop: 2,
            }}
          >
            <StatIndicator label="ATK" stage={stages.attack} />
            <StatIndicator label="DEF" stage={stages.defense} />
            <StatIndicator label="SP.A" stage={stages.specialAttack} />
            <StatIndicator label="SP.D" stage={stages.specialDefense} />
            <StatIndicator label="SPD" stage={stages.speed} />
          </View>
        )}
      </View>

      {/* Independent Animated Sprite */}
      <Animated.View
        style={{
          transform: [{ translateY: moveAnim }, { translateX: shakeAnim }],
          position: "absolute",
          bottom: 0,
          [isBack ? "left" : "right"]: isBack ? 0 : 40,
          opacity: opacityAnim,
        }}
      >
        <Image
          source={{ uri: imageSource }}
          style={{
            width: isBack ? 180 : 100,
            height: isBack ? 180 : 100,
            resizeMode: "contain",
          }}
        />
      </Animated.View>
    </View>
  );
}
