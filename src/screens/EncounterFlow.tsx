import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { fetchMoveBatch } from "../encounter/fetchWithCache";
import { EncounterPokemon, MoveDetail } from "../encounter/types";
import { useEncounterQueue } from "../hooks/useEncounterQueue";
import { EncounterFlowProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";
import { calculateHp, calculateStat } from "../utils/statCalculator";
import { Battle } from "./BattleScreen";
import { EncounterTransitionScreen } from "./EncounterTransitionScreen";

type Screen = "transition" | "battle";

/**
 * Maps EncounterPokemon (from the queue) and fetched move details to the full Pokemon type.
 */
function mapEncounterToPokemon(
  encounter: EncounterPokemon,
  moveDetails: MoveDetail[],
): Pokemon {
  const hp = calculateHp(encounter.baseStats.hp, encounter.level);
  return {
    id: encounter.id,
    name: encounter.name,
    level: encounter.level,
    type: encounter.types,
    hp: hp,
    maxHp: hp,
    attack: calculateStat(encounter.baseStats.attack, encounter.level),
    defense: calculateStat(encounter.baseStats.defense, encounter.level),
    specialAttack: calculateStat(encounter.baseStats.spAttack, encounter.level),
    specialDefense: calculateStat(
      encounter.baseStats.spDefense,
      encounter.level,
    ),
    speed: calculateStat(encounter.baseStats.speed, encounter.level),
    frontImage: encounter.image,
    backImage: encounter.backImage,
    isShiny: encounter.isShiny,
    moves: moveDetails.map((detail) => ({
      name: detail.name,
      power: detail.power ?? 0,
      damageClass: detail.damageClass,
      type: detail.type,
      accuracy: detail.accuracy,
      statChanges: detail.statChanges,
      description: detail.description,
      priority: detail.priority,
    })),
    cry: `https://play.pokemonshowdown.com/audio/cries/${encounter.name.toLowerCase().replace(/[^a-z]/g, "")}.mp3`,
  };
}

/**
 * EncounterFlow orchestrates the full region → area → battle loop.
 */
export function EncounterFlow({ route, navigation }: EncounterFlowProps) {
  const { region, area, player, onExit } = route.params;
  const [screen, setScreen] = useState<Screen>("transition");
  const [fullyLoadedEnemy, setFullyLoadedEnemy] = useState<Pokemon | null>(
    null,
  );
  const [isLoadingMoves, setIsLoadingMoves] = useState(false);

  const { currentEncounter, isReady, isInitialLoading, advance, reset } =
    useEncounterQueue(region, area);

  // Fetch move details when a new encounter arrives
  useEffect(() => {
    if (currentEncounter && isReady) {
      // Prevent re-fetching if we already have the fully loaded enemy for THIS encounter
      if (
        fullyLoadedEnemy &&
        fullyLoadedEnemy.id === currentEncounter.id &&
        fullyLoadedEnemy.level === currentEncounter.level
      ) {
        return;
      }

      async function loadMoveDetails() {
        try {
          const moveDetails = await fetchMoveBatch(currentEncounter.moves);
          const enemy = mapEncounterToPokemon(currentEncounter, moveDetails);
          setFullyLoadedEnemy(enemy);
        } catch (error) {
          console.error("[EncounterFlow] Failed to load move details:", error);
        } finally {
          setIsLoadingMoves(false);
        }
      }
      loadMoveDetails();
    } else {
      setFullyLoadedEnemy(null);
    }
  }, [currentEncounter, isReady]);

  const handleTransitionReady = useCallback(() => {
    setScreen("battle");
  }, []);

  const handleBattleEnd = useCallback(
    (winner: "player" | "enemy") => {
      console.log(`Battle ended. Winner: ${winner}`);
      // Wait a bit then go back to transition for the next encounter
      setTimeout(() => {
        advance();
        setScreen("transition");
      }, 2000);
    },
    [advance],
  );

  const handleExit = useCallback(() => {
    reset();
    onExit();
  }, [reset, onExit]);

  if (screen === "transition") {
    return (
      <EncounterTransitionScreen
        region={region}
        area={area}
        isDataReady={
          !isInitialLoading && isReady && !!fullyLoadedEnemy && !isLoadingMoves
        }
        onReady={handleTransitionReady}
      />
    );
  }

  if (!fullyLoadedEnemy) return null;

  return (
    <View style={styles.container}>
      <Battle
        player={player}
        enemy={fullyLoadedEnemy}
        onBattleEnd={handleBattleEnd}
        onRun={handleExit}
        onBagPress={() =>
          navigation.navigate("InventoryBag", {
            pokemon: fullyLoadedEnemy,
            onCatchResult: (result) => {
              // We'll handle this in an effect or similar to show swap modal if needed
              navigation.setParams({ catchResult: result } as any);
            },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
