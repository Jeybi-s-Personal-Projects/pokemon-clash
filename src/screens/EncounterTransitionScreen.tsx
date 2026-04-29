import type { Area, Region } from "@/src/encounter/batchGenerator";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  Easing
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  region: Region;
  area: Area;
  /** Called once animation completes AND data is ready */
  onReady: () => void;
  /** True when useEncounterQueue has finished its initial load */
  isDataReady: boolean;
};

const AREA_MESSAGES: Record<Area, string> = {
  cave: "A Pokémon lurks in the dark...",
  grass: "A wild Pokémon appeared!",
  water: "A Pokémon surfaced from below!",
  forest: "A Pokémon jumped from the trees!",
};

// Faster transition
const ANIMATION_DURATION = 800;

export function EncounterTransitionScreen({
  area,
  onReady,
  isDataReady,
}: Props) {
  const opacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const scale = useSharedValue(1.2);

  useEffect(() => {
    // Entrance animation
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.quad) });

    // Flash sequence
    flashOpacity.value = withSequence(
      withDelay(200, withTiming(0.8, { duration: 100 })),
      withTiming(0, { duration: 100 }),
      withTiming(0.8, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    const timer = setTimeout(() => {
       if (isDataReady) {
         onReady();
       }
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [isDataReady]);

  // If data becomes ready after the animation duration, we trigger it immediately
  useEffect(() => {
    if (isDataReady) {
        // We could add a small additional delay if needed, but the user wants it fast
    }
  }, [isDataReady]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#000", "#1a1a1a", "#000"]}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{AREA_MESSAGES[area]}</Text>
          {!isDataReady && (
            <Text style={styles.loading}>Loading encounter...</Text>
          )}
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.flash, 
          flashStyle,
          { backgroundColor: "#fff" }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    padding: 30,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  message: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    fontFamily: "monospace",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  loading: {
    color: "#888",
    marginTop: 20,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    pointerEvents: "none",
  },
});
