import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { StatStages } from "../../battle/battleTypes";
import { Pokemon } from "../../types/pokemon";
import { getExpForLevel } from "../../utils/experienceCalculator";
import PokemonCard from "../pokemonCard";
interface BattleFieldProps {
  player: Pokemon;
  enemy: Pokemon;
  playerStages: StatStages;
  enemyStages: StatStages;
  attackingSide: "player" | "enemy" | null;
  dancingSide: "player" | "enemy" | null;
  hitSide: "player" | "enemy" | null;
  isPlayerEntering?: boolean;
  isEnemyCaught?: boolean;
}

const bg = require("@/assets/backgrounds/background-grass.jpg");

export const BattleField = ({
  player,
  enemy,
  playerStages,
  enemyStages,
  attackingSide,
  dancingSide,
  hitSide,
  isPlayerEntering,
  isEnemyCaught,
}: BattleFieldProps) => {
  return (
    <View style={styles.container}>
      <Image source={bg} style={styles.background} />
      <PokemonCard
        pokemon={enemy}
        stages={enemyStages}
        isAttacking={attackingSide === "enemy"}
        isDancing={dancingSide === "enemy"}
        isHit={hitSide === "enemy"}
        isCaught={isEnemyCaught}
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
    position: "relative",
  },
  spacer: {
    height: 100,
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 0,
    top: 0,
    left: 0,
  },
});
