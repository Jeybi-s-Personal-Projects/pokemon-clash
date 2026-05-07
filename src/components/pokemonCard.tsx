import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
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
  isCaught?: boolean;
  stages?: StatStages;
  exp?: number;
  maxExp?: number;
};

export default function PokemonCard({
  pokemon,
  isBack,
  isAttacking,
  isDancing,
  isHit,
  isEntering,
  isCaught,
  stages,
  exp,
  maxExp,
}: Props) {
  const imageSource = isBack ? pokemon.backImage : pokemon.frontImage;

  // Animation values
  const moveAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const isFading = useRef(false);

  useEffect(() => {
    if (isAttacking) {
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
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
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

  // Separate effect to handle entering animation
  useEffect(() => {
    if (isEntering) {
      opacityAnim.setValue(0);
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else if (isCaught) {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      opacityAnim.setValue(1);
    }
  }, [isEntering, isCaught, pokemon.id, imageSource]);

  useEffect(() => {
    if (pokemon.hp <= 0 && !isCaught) {
      if (isFading.current) return;
      isFading.current = true;

      const delay = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          isFading.current = false;
        });
      }, 600);

      return () => clearTimeout(delay);
    } else {
      if (!isFading.current && !isEntering && !isCaught) {
        opacityAnim.setValue(1);
      }
    }
  }, [pokemon.hp, pokemon.id]);

  return (
    <View style={{ alignItems: "center" }}>
      {!isBack && (
        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            {pokemon.name.toUpperCase()}
          </Text>
          <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
            LV {pokemon.level}
          </Text>
          {stages && (
            <View style={{ flexDirection: "row", gap: 5, marginTop: 4 }}>
              {Object.entries(stages).map(([stat, val]) => {
                if (val === 0) return null;
                return (
                  <Text
                    key={stat}
                    style={{
                      fontSize: 10,
                      color: val > 0 ? "#4ade80" : "#f87171",
                    }}
                  >
                    {stat.slice(0, 3).toUpperCase()}
                    {val > 0 ? `+${val}` : val}
                  </Text>
                );
              })}
            </View>
          )}
          <HpBar hp={pokemon.hp} maxHp={pokemon.maxHp} />
          {exp !== undefined && maxExp !== undefined && (
            <ExpBar exp={exp} maxExp={maxExp} />
          )}
        </View>
      )}

      <Animated.View
        style={{
          transform: [{ translateX: moveAnim }, { translateX: shakeAnim }],
          opacity: opacityAnim,
        }}
      >
        <Animated.Image
          source={{ uri: imageSource }}
          style={{
            width: isBack ? 160 : 100,
            marginRight: isBack ? 0 : 15,
            marginLeft: isBack ? 15 : 0,
            height: isBack ? 160 : 100,
            resizeMode: "contain",
          }}
        />
      </Animated.View>

      {isBack && (
        <View style={{ marginTop: 10, alignItems: "center" }}>
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            {pokemon.name.toUpperCase()}
          </Text>
          <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
            LV {pokemon.level}
          </Text>
          <HpBar hp={pokemon.hp} maxHp={pokemon.maxHp} />
        </View>
      )}
    </View>
  );
}
