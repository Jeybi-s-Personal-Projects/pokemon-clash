import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { BattleField } from "../components/battle/BattleField";
import StatusModal from "../components/statusModal";
import { useAuth } from "../context/AuthContext";
import { savePokemon } from "../hooks/savePokemon";
import { CatchingScreenProps } from "../types/navigation";
import { SPECIES } from "../data/pokemon/species/species";

const initialStages = {
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
};

const BALL_IMAGES: Record<string, any> = {
  "poke-ball": require("../../assets/items/pokeball.png"),
  "great-ball": require("../../assets/items/greatball.png"),
  "ultra-ball": require("../../assets/items/ultraball.png"),
  "master-ball": require("../../assets/items/masterball.png"),
};

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

  // Animations
  const ballAnim = useRef(new Animated.ValueXY({ x: -100, y: 300 })).current;
  const ballOpacity = useRef(new Animated.Value(0)).current;
  const ballRotation = useRef(new Animated.Value(0)).current;
  const ballScale = useRef(new Animated.Value(1)).current;

  const cursorOpacity = useRef(new Animated.Value(1)).current;

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
      // --- 1. AUTHENTIC CATCH RATE CALCULATION ---
      const baseCatchRate = SPECIES[enemy.speciesId]?.capture_rate || 50;
      const ballModifier = item.catchRate || 1;
      
      // Status Bonus
      let statusBonus = 1;
      if (enemy.status === "sleep" || enemy.status === "freeze") statusBonus = 2.0;
      else if (enemy.status) statusBonus = 1.5;

      // Formula: a = ((3 * MaxHP - 2 * CurrentHP) * CatchRate * BallModifier) / (3 * MaxHP) * StatusModifier
      const a = (
        ((3 * enemy.maxHp - 2 * enemy.hp) * baseCatchRate * ballModifier) / (3 * enemy.maxHp)
      ) * statusBonus;

      // Final Probability P = a / 255
      const success = item.id === "master-ball" ? true : Math.random() * 255 < a;

      // --- 2. PLAY ANIMATION (SAME FOR BOTH SUCCESS & FAILURE) ---
      await delay(500);

      // THROW: Adjust 'x' (left/right) and 'y' (up/down) to target the wild Pokemon sprite
      // Positive X: Right, Negative X: Left
      // Positive Y: Down, Negative Y: Up
      ballOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(ballAnim, {
          toValue: { x: 60, y: -60 }, // TARGET POSITION - Edit these numbers to move the ball
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(ballRotation, {
          toValue: 1, // Spin amount
          duration: 800,
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

      await delay(800); // Wait for throw to land

      // Reset rotation value to 0 so wobble starts from upright position
      ballRotation.setValue(0);

      // HIT & CAPTURE: Fast fade the wild Pokemon
      setIsEnemyCaught(true); 
      await delay(500);

      // WOBBLE: The suspense shakes (Plays for both)
      const wobble = () => {
        return Animated.sequence([
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
      };

      // Play 3 wobbles
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => wobble().start(resolve));
        await delay(200);
      }

      // --- 3. HANDLE FINAL OUTCOME ---
      if (success) {
        if (user) {
          try {
            const { teamFull } = await savePokemon(enemy, user.id);
            setIsSuccess(true);
            setMessage(`GOTCHA! ${enemy.name.toUpperCase()} was caught!`);
            await delay(1500);

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
            navigation.goBack();
          }
        }
      } else {
        // BREAK FREE LOGIC
        setIsSuccess(false);
        setIsEnemyCaught(false); // Make enemy visible again
        ballOpacity.setValue(0); // Hide ball
        setMessage(`OH NO! The ${enemy.name.toUpperCase()} broke free!`);
        await delay(1500);
        setStatusMessage(`The Pokémon broke free! Returning to battle...`);
        setStatusVisible(true);
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
      </View>

      {/* Message Box */}
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
    marginLeft: -30, // Offset to center correctly
    marginTop: -30,
    justifyContent: "center",
    alignItems: "center",
  },
  ballImage: {
    width: 50,
    height: 50,
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
