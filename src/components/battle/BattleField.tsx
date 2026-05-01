import React from "react";
import { View, StyleSheet } from "react-native";
import PokemonCard from "../pokemonCard";
import { Pokemon } from "../../types/pokemon";
import { StatStages } from "../../battle/battleTypes";
import { getExpForLevel } from "../../utils/experienceCalculator";

interface BattleFieldProps {
  player: Pokemon;
  enemy: Pokemon;
  playerStages: StatStages;
  enemyStages: StatStages;
  attackingSide: "player" | "enemy" | null;
  dancingSide: "player" | "enemy" | null;
  hitSide: "player" | "enemy" | null;
  isPlayerEntering?: boolean;
}

export const BattleField = ({
  player,
  enemy,
  playerStages,
  enemyStages,
  attackingSide,
  dancingSide,
  hitSide,
  isPlayerEntering,
}: BattleFieldProps) => {
  return (
    <View style={styles.container}>
      <PokemonCard
        pokemon={enemy}
        stages={enemyStages}
        isAttacking={attackingSide === "enemy"}
        isDancing={dancingSide === "enemy"}
        isHit={hitSide === "enemy"}
      />
      <View style={styles.spacer} />
      <PokemonCard
        pokemon={player}
        stages={playerStages}
        isBack={true}
        isAttacking={attackingSide === "player"}
        isDancing={dancingSide === "player"}
        isHit={hitSide === "player"}
        isEntering={isPlayerEntering}
        exp={
          player.experience -
          getExpForLevel(player.level, player.growthRate || "medium-fast")
        }
        maxExp={
          getExpForLevel(player.level + 1, player.growthRate || "medium-fast") -
          getExpForLevel(player.level, player.growthRate || "medium-fast")
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  spacer: {
    height: 100,
  },
});
