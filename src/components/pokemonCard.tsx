import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Image, Text, View } from "react-native";
import { Pokemon } from "../types/pokemon";
import HpBar from "./hpBar";

type Props = {
  pokemon: Pokemon;
  isBack?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
};

export default function PokemonCard({
  pokemon,
  isBack,
  isAttacking,
  isHit,
}: Props) {
  const imageSource = isBack ? pokemon.backImage : pokemon.frontImage;

  // Animation values
  const moveAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAttacking) {
      // Move toward opponent (up for back/player, down for front/enemy)
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

        <HpBar hp={pokemon.hp} maxHp={pokemon.maxHp} />
      </View>

      {/* Independent Animated Sprite */}
      <Animated.View
        style={{
          transform: [{ translateY: moveAnim }, { translateX: shakeAnim }],
          position: "absolute",
          bottom: 0,
          [isBack ? "left" : "right"]: isBack ? 0 : 40,
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
