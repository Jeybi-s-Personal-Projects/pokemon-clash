import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SPECIES } from "../data/pokemon/species/species";
import { fetchMoveBatch } from "../encounter/fetchWithCache";
import { EncounterPokemon, MoveDetail } from "../encounter/types";
import { useEncounterQueue } from "../hooks/useEncounterQueue";
import { supabase } from "../lib/supabase";
import { EncounterFlowProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";
import { getExpForLevel, getGrowthRate } from "../utils/experienceCalculator";
import { calculateHp, calculateStat } from "../utils/statCalculator";
import { Battle } from "./BattleScreen";
import { EncounterTransitionScreen } from "./EncounterTransitionScreen";

type Screen = "transition" | "battle";

/**
 * Picks a random ability for the species.
 * If 1 ability: returns that one.
 * If > 1: 10% chance for the hidden one (last in array), 90% for a regular one.
 */
function getRandomAbility(speciesId: number): string {
  const speciesData = SPECIES[speciesId];
  if (
    !speciesData ||
    !speciesData.abilities ||
    speciesData.abilities.length === 0
  ) {
    return "none";
  }

  const abilities = speciesData.abilities;
  if (abilities.length === 1) return abilities[0];
  // 10% chance for hidden ability (usually the last one in the list)
  const isHidden = Math.random() < 0.1;
  if (isHidden) {
    return abilities[abilities.length - 1];
  } else {
    // Pick one of the regular abilities (all but the last one)
    const regularAbilities = abilities.slice(0, -1);
    const randomIndex = Math.floor(Math.random() * regularAbilities.length);
    return regularAbilities[randomIndex];
  }
}

/**
 * Maps EncounterPokemon (from the queue) and fetched move details to the full Pokemon type.
 */
function mapEncounterToPokemon(
  encounter: EncounterPokemon,
  moveDetails: MoveDetail[],
): Pokemon {
  const hp = calculateHp(encounter.baseStats.hp, encounter.level);
  const speciesId = encounter.id;
  const growthRate = getGrowthRate(speciesId);
  const experience = getExpForLevel(encounter.level, growthRate);
  const ability = getRandomAbility(speciesId);

  return {
    speciesId,
    name: encounter.name,
    level: encounter.level,
    experience,
    growthRate,
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
    ability,
    moves: moveDetails.map((detail) => ({
      name: detail.name,
      power: detail.power ?? 0,
      pp: detail.pp ?? 0,
      maxPp: detail.pp ?? 0,
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
  const { region, area, team: initialTeam } = route.params;
  const [localTeam, setLocalTeam] = useState<Pokemon[]>(initialTeam);
  const [activeIndex, setActiveIndex] = useState(0);
  const [defeatCount, setDefeatCount] = useState(0);
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const [screen, setScreen] = useState<Screen>("transition");
  const [fullyLoadedEnemy, setFullyLoadedEnemy] = useState<Pokemon | null>(
    null,
  );
  const [isLoadingMoves, setIsLoadingMoves] = useState(false);

  // Clear catchPending after it's been "consumed" by the state
  useEffect(() => {
    if (route.params.catchPending) {
      setScreen("battle");
      const timer = setTimeout(() => {
        navigation.setParams({ catchPending: undefined } as any);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [route.params.catchPending, navigation]);

  const { currentEncounter, isReady, isInitialLoading, advance, reset } =
    useEncounterQueue(region, area);

  // Fetch move details when a new encounter arrives
  useEffect(() => {
    const encounter = currentEncounter;
    if (encounter && isReady) {
      if (
        fullyLoadedEnemy &&
        fullyLoadedEnemy.id === encounter.id &&
        fullyLoadedEnemy.level === encounter.level
      ) {
        return;
      }

      async function loadMoveDetails() {
        try {
          if (!encounter) return;
          setIsLoadingMoves(true);
          const moveDetails = await fetchMoveBatch(encounter.moves);
          const enemy = mapEncounterToPokemon(encounter, moveDetails);
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

  const activePlayer = localTeam[activeIndex];

  const syncAllProgress = async (finalTeam: Pokemon[]) => {
    try {
      const syncData = finalTeam
        .filter((p) => !!p.id)
        .map((p) => ({
          id: p.id,
          pk_species_id: p.speciesId,
          pk_name: p.name,
          pk_types: p.type,
          pk_ability: p.ability,
          pk_front_image: p.frontImage,
          pk_back_image: p.backImage,
          pk_cry: p.cry,
          pk_level: p.level,
          pk_experience: p.experience,
          pk_hp: p.maxHp, // Fully heal
          pk_max_hp: p.maxHp,
          pk_attack: p.attack,
          pk_defense: p.defense,
          pk_special_attack: p.specialAttack,
          pk_special_defense: p.specialDefense,
          pk_speed: p.speed,
        }));

      if (syncData.length === 0) return;

      const { error } = await supabase.from("pokemon").upsert(syncData);

      if (error) console.error("Error syncing progress:", error);
    } catch (e) {
      console.error("Failed to sync progress", e);
    }
  };

  const checkpointProgress = async (finalTeam: Pokemon[]) => {
    await syncAllProgress(finalTeam);
  };

  const handleTransitionReady = useCallback(() => {
    setScreen("battle");
  }, []);

  const handleBattleEnd = useCallback(
    async (
      winner: "player" | "enemy",
      updatedTeam: Pokemon[],
      didEvolve: boolean = false,
      newIndex: number = 0,
    ) => {
      setLocalTeam(updatedTeam);
      setActiveIndex(newIndex);

      if (winner === "player") {
        setDefeatCount((prev) => prev + 1);
      }

      if (winner === "enemy") {
        // Session ended by defeat
        await syncAllProgress(updatedTeam);
        reset();
        navigation.reset({
          index: 0,
          routes: [{ name: "Dashboard" as any }],
        });
        return;
      }

      // Session continues - No automatic sync here
      setTimeout(() => {
        advance();
        setScreen("transition");
      }, 2000);
    },
    [advance, navigation, reset],
  );

  const handleExit = useCallback(
    async (finalTeam: Pokemon[]) => {
      // Session ended by choice
      await syncAllProgress(finalTeam);
      reset();
      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard" as any }],
      });
    },
    [reset, navigation],
  );

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
        player={activePlayer}
        team={localTeam}
        enemy={fullyLoadedEnemy}
        onBattleEnd={handleBattleEnd}
        onCheckpoint={checkpointProgress}
        onRun={handleExit}
        onBagPress={(p, t, e) =>
          navigation.navigate("InventoryBag", {
            player: p,
            team: t,
            pokemon: e,
            fromScreen: "EncounterFlow",
          } as any)
        }
        catchPending={route.params.catchPending}
        isAutoBattle={isAutoBattle}
        onToggleAutoBattle={setIsAutoBattle}
        defeatCount={defeatCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
