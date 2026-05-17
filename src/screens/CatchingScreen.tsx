import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { BattleField } from "../components/battle/BattleField";
import StatusModal from "../components/statusModal";
import { useAuth } from "../context/AuthContext";
import { SPECIES } from "../data/pokemon/species/species";
import { savePokemon, syncAllProgress } from "../hooks/savePokemon";
import { CatchingScreenProps } from "../types/navigation";
import db from "../lib/db";

const initialStages = {
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
  accuracy: 0,
  evasion: 0,
};

const BALL_IMAGES: Record<string, any> = {
  "poke-ball": require("../../assets/items/pokeball.png"),
  "great-ball": require("../../assets/items/greatball.png"),
  "ultra-ball": require("../../assets/items/ultraball.png"),
  "master-ball": require("../../assets/items/masterball.png"),
};

// Star config: angle (degrees from center) and slight offset
const STARS = [
  { angle: -60, delay: 0 },
  { angle: -90, delay: 80 },
  { angle: -120, delay: 160 },
];

function StarBurst({
  visible,
  ballPosition,
}: {
  visible: boolean;
  ballPosition: { x: number; y: number };
}) {
  const anims = useRef(
    STARS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      scale: new Animated.Value(0.3),
    })),
  ).current;

  useEffect(() => {
    if (!visible) return;

    const animations = STARS.map((star, i) => {
      const radians = (star.angle * Math.PI) / 180;
      const distance = 55;
      const targetX = Math.cos(radians) * distance;
      const targetY = Math.sin(radians) * distance;

      return Animated.sequence([
        Animated.delay(star.delay),
        Animated.parallel([
          Animated.timing(anims[i].opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(anims[i].scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anims[i].translateX, {
            toValue: targetX,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anims[i].translateY, {
            toValue: targetY,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(anims[i].opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(60, animations).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {STARS.map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.star,
            {
              left: ballPosition.x,
              top: ballPosition.y,
              opacity: anims[i].opacity,
              transform: [
                { translateX: anims[i].translateX },
                { translateY: anims[i].translateY },
                { scale: anims[i].scale },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="star-four-points"
            size={18}
            color="#FFD700"
          />
        </Animated.View>
      ))}
    </>
  );
}

export default function CatchingScreen({
  route,
  navigation,
}: CatchingScreenProps) {
  const { player, team, enemy, item } = route.params;
  const { user } = useAuth();

  const [message, setMessage] = useState(
    `PLAYER used ${item.name.toUpperCase()}!`,
  );
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEnemyCaught, setIsEnemyCaught] = useState(false);
  const [showStars, setShowStars] = useState(false);

  // Animations
  const ballAnim = useRef(new Animated.ValueXY({ x: -100, y: 300 })).current;
  const ballOpacity = useRef(new Animated.Value(0)).current;
  const ballRotation = useRef(new Animated.Value(0)).current;
  const ballScale = useRef(new Animated.Value(1)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const isMounted = useRef(true);

  // Ball screen position for star origin
  // These match the ballContainer style: centered in the arena
  const BALL_SCREEN_X = -9; // adjust if needed
  const BALL_SCREEN_Y = -9;

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  Animated.loop(
    Animated.sequence([
      Animated.timing(cursorOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(cursorOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]),
    { resetBeforeIteration: true },
  ).start();

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    async function runSequence() {
      // Consume item at the start
      if (user) {
        try {
          db.runSync(
            `UPDATE inventory SET quantity = MAX(0, quantity - 1), updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = ? AND item_id = ?`,
            [user.id, item.id]
          );
        } catch (error) {
          console.error("Failed to consume item:", error);
        }
      }

      const baseCatchRate = SPECIES[enemy.speciesId]?.capture_rate || 50;
      const ballModifier = item.catchRate || 1;

      let statusBonus = 1;
      if (enemy.status === "sleep" || enemy.status === "freeze")
        statusBonus = 2.0;
      else if (enemy.status) statusBonus = 1.5;

      const a =
        (((3 * enemy.maxHp - 2 * enemy.hp) * baseCatchRate * ballModifier) /
          (3 * enemy.maxHp)) *
        statusBonus;

      const success =
        item.id === "master-ball" ? true : Math.random() * 255 < a;

      await delay(500);
      if (!isMounted.current) return;

      ballOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(ballAnim, {
          toValue: { x: 60, y: -60 },
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(ballRotation, {
          toValue: 2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(ballScale, {
            toValue: 1.5,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(ballScale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      await delay(800);
      if (!isMounted.current) return;

      ballRotation.setValue(0);
      setIsEnemyCaught(true);
      await delay(500);
      if (!isMounted.current) return;

      const wobble = () =>
        Animated.sequence([
          Animated.timing(ballRotation, {
            toValue: 0.1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(ballRotation, {
            toValue: -0.1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(ballRotation, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]);

      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => wobble().start(resolve));
        await delay(200);
        if (!isMounted.current) return;
      }

      if (success) {
        if (user) {
          try {
            // 1. Revert Mega if active before saving anything
            let finalTeam = team || [];
            if (route.params.revertMegaInTeam) {
              finalTeam = route.params.revertMegaInTeam(finalTeam);
            }

            // 2. Sync the player's team progress (HP, EXP, etc.) and HEAL
            await syncAllProgress(finalTeam, true);

            // 3. Save the newly caught pokemon
            const { teamFull } = await savePokemon(enemy, user.id);
            setIsSuccess(true);
            setMessage(`GOTCHA! ${enemy.name.toUpperCase()} was caught!`);

            // 🌟 Trigger star burst
            setShowStars(true);
            await delay(800);
            if (!isMounted.current) return;
            setShowStars(false);

            await delay(700);
            if (!isMounted.current) return;

            setStatusMessage(
              `Success! ${enemy.name.toUpperCase()} was added to your collection.${
                teamFull
                  ? "\n\nYour team was full, so it was sent to the PC."
                  : ""
              }`,
            );
            setStatusVisible(true);
          } catch (error) {
            console.error("Save failed", error);
            setMessage("Something went wrong...");
            await delay(1500);
            if (!isMounted.current) return;
            route.params.onCatchFailed?.();
            navigation.goBack();
          }
        }
      } else {
        setIsSuccess(false);
        setIsEnemyCaught(false);
        ballOpacity.setValue(0);
        setMessage(`OH NO! The ${enemy.name.toUpperCase()} broke free!`);

        await delay(1500);
        if (!isMounted.current) return;

        route.params.onCatchFailed?.();
        navigation.goBack();
      }
    }

    runSequence();
  }, []);

  const handleCloseModal = () => {
    setStatusVisible(false);
    if (isSuccess) {
      navigation.popToTop();
    } else {
      navigation.pop(1);
    }
  };

  const spin = ballRotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-360deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.battleArena}>
        <BattleField
          player={player}
          enemy={enemy}
          playerStages={initialStages}
          enemyStages={initialStages}
          attackingSide={null}
          dancingSide={null}
          hitSide={null}
          floatingDamage={null}
          isEnemyCaught={isEnemyCaught}
        />

        {/* The Animated Pokéball */}
        <Animated.View
          style={[
            styles.ballContainer,
            {
              opacity: ballOpacity,
              transform: [
                { translateX: ballAnim.x },
                { translateY: ballAnim.y },
                { rotate: spin },
                { scale: ballScale },
              ],
            },
          ]}
        >
          <Image
            source={BALL_IMAGES[item.id] || BALL_IMAGES["poke-ball"]}
            style={styles.ballImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ⭐ Star burst overlay — positioned at ball's resting spot */}
        <StarBurst
          visible={showStars}
          ballPosition={{ x: "65%" as any, y: "40%" as any }}
        />
      </View>

      <View style={styles.logBox}>
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            {message}
            <View style={styles.arrowContainer}>
              <Animated.View
                style={[styles.cursorArrow, { opacity: cursorOpacity }]}
              />
            </View>
          </Text>
        </View>
      </View>

      <StatusModal
        visible={statusVisible}
        message={statusMessage}
        type={isSuccess ? "success" : "error"}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#080B14",
  },
  battleArena: {
    flex: 1,
    position: "relative",
  },
  ballContainer: {
    position: "absolute",
    zIndex: 20,
    top: "50%",
    left: "50%",
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    justifyContent: "center",
    alignItems: "center",
  },
  ballImage: {
    width: 50,
    height: 50,
  },
  // Star sits at the same anchor as the ball
  star: {
    position: "absolute",
    zIndex: 30,
    marginLeft: -9, // half of icon size 18
    marginTop: -9,
  },
  logBox: {
    borderTopWidth: 2,
    borderTopColor: "#6bdae233",
    padding: 24,
    height: 280,
    width: "100%",
    backgroundColor: "#080B14",
  },
  messageBox: {
    borderWidth: 2,
    height: "80%",
    width: "100%",
    borderColor: "#6bdae244",
    borderRadius: 12,
    backgroundColor: "#111827",
    justifyContent: "center",
  },
  messageText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#E2C96B",
  },
  arrowContainer: {
    height: 20,
    width: 30,
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
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
  },
});
