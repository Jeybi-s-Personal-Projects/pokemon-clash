import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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

  useEffect(() => {
    async function runSequence() {
      // 1. Initial Shake delay
      await delay(2500);

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
      <View style={styles.messageBox}>
        <Text style={styles.messageText}>{message}</Text>
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
    backgroundColor: "#1F2937",
  },
  battleArena: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  messageBox: {
    backgroundColor: "#111827",
    borderTopWidth: 4,
    borderColor: "#374151",
    padding: 24,
    minHeight: 120,
    justifyContent: "center",
  },
  messageText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
