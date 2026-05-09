import { Pokemon } from "@/src/types/pokemon";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useEffect, useRef } from "react";
import { Animated, ImageBackground, StyleSheet, View } from "react-native";

const megaEvolveSound = require("@/assets/sounds/mega-evolve.mp3");

interface Props {
  visible: boolean;
  pokemon: Pokemon | null;
}

export const MegaEvolutionOverlay = ({ visible, pokemon }: Props) => {
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const cryPlayedRef = useRef(false);

  const player = useAudioPlayer(megaEvolveSound);
  const playerStatus = useAudioPlayerStatus(player);

  const baseName = pokemon?.name?.replace(/^Mega /i, "").toLowerCase();

  const crySource = baseName
    ? {
        uri: `https://play.pokemonshowdown.com/audio/cries/${baseName}-mega.mp3`,
      }
    : null;
  const cryPlayer = useAudioPlayer(crySource);
  const cryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Replace the didJustFinish useEffect with this:
  useEffect(() => {
    if (playerStatus.duration && visible && pokemon && !cryPlayedRef.current) {
      const msUntilEarly = (playerStatus.duration - 1) * 1000;

      cryTimerRef.current = setTimeout(() => {
        cryPlayedRef.current = true;
        cryPlayer.play();
      }, msUntilEarly);
    }

    return () => {
      if (cryTimerRef.current) clearTimeout(cryTimerRef.current);
    };
  }, [playerStatus.duration, visible, pokemon]);

  useEffect(() => {
    if (visible && pokemon) {
      cryPlayedRef.current = false;
      player.seekTo(0);
      player.play();

      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 4300,
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
