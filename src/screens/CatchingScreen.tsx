import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import PokemonCard from "../components/pokemonCard";
import StatusModal from "../components/statusModal";
import { useAuth } from "../context/AuthContext";
import { savePokemon } from "../hooks/savePokemon";
import { CatchingScreenProps } from "../types/navigation";

export default function CatchingScreen({
  route,
  navigation,
}: CatchingScreenProps) {
  const { player, enemy, item } = route.params;
  const { user } = useAuth();

  const [message, setMessage] = useState(
    `PLAYER used ${item.name.toUpperCase()}!`,
  );
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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

  useEffect(() => {
    async function runSequence() {
      // 1. Initial Shake delay
      await delay(1000);

      // 2. Logic (Simulate or actual)
      // For prototype, we usually catch or use a random chance
      // Let's use a simple formula: (catchRate * 100) / 255 chance?
      // Or for now, 70% success if not Master Ball
      const chance = item.id === "master-ball" ? 1.0 : 0.7;
      const success = Math.random() < chance;

      if (success && user) {
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
      } else {
        setIsSuccess(false);
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
      // Go to Dashboard or List
      navigation.navigate("Dashboard");
    } else {
      // Go back to Bag, then Bag will go back to Battle?
      // Better: pop back to the actual battle screen
      navigation.pop(2);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.battleArena}>
        <PokemonCard pokemon={enemy} isHit={false} isAttacking={false} />
        <View style={{ height: 100 }} />
        <PokemonCard
          pokemon={player}
          isBack={true}
          isHit={false}
          isAttacking={false}
        />
      </View>

      {/* Message Box (Mimic BattleActions style) */}
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
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logBox: {
    borderTopWidth: 2,
    borderTopColor: "#6bdae233",
    padding: 24,
    height: 280,
    width: "100%",
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
