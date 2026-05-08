import { Pokemon } from "@/src/types/pokemon";
import React, { useEffect, useRef } from "react";
import { Animated, ImageBackground, StyleSheet, View } from "react-native";

interface Props {
  visible: boolean;
  pokemon: Pokemon | null;
}

export const MegaEvolutionOverlay = ({ visible, pokemon }: Props) => {
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && pokemon) {
      // Visual Animations
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 25 },
      ).start();
    } else {
      contentOpacity.setValue(0);
      flashOpacity.setValue(0);
    }
  }, [visible, pokemon]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        <ImageBackground
          source={require("@/assets/backgrounds/mega-evolution-screen.jpg")}
          style={styles.image}
        />
        <Animated.View style={[styles.flash, { opacity: flashOpacity }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    zIndex: 1000,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    flex: 1,
    resizeMode: "cover",
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    zIndex: 1001,
  },
});
