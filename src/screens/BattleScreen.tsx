import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import BattleActions from "../components/battleActions";
import PokemonCard from "../components/pokemonCard";

import { getRandomMove } from "../battle/ai";
import { dealDamage, isGameOver } from "../battle/battleEngine";
import { BattleState } from "../battle/battleTypes";
import { BattleScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";

import { setAudioModeAsync } from "expo-audio";

interface BattleProps {
  player: Pokemon;
  enemy: Pokemon;
  onBattleEnd?: (winner: "player" | "enemy") => void;
  onRun?: () => void;
  onBagPress?: () => void;
}

export function Battle({
  player,
  enemy,
  onBattleEnd,
  onRun,
  onBagPress,
}: BattleProps) {
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const [state, setState] = useState<BattleState>({
    player,
    enemy,
    turn: "player",
    log: [],
    winner: null,
    attackingSide: null,
    hitSide: null,
  });

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const attack = async (index: number) => {
    if (state.attackingSide || state.winner) return;

    // 1. Player Turn
    const move = state.player.moves[index];

    // Initial delay before starting the attack sequence
    await delay(1500);

    // Show "Player used..."
    setState((s) => ({
      ...s,
      log: [...s.log, `Player used ${move.name}!`],
    }));

    // Wait 1.5s after showing the log before moving
    await delay(1500);
    setState((s) => ({ ...s, attackingSide: "player" }));

    // Wait for movement to "hit", then trigger Hit Animation (Shake) + Damage
    await delay(400); // Animation duration
    setState((s) => ({ ...s, hitSide: "enemy", attackingSide: null }));

    const newEnemyHp = dealDamage(state.enemy.hp, move);
    const afterPlayerAttack: BattleState = {
      ...state,
      enemy: { ...state.enemy, hp: newEnemyHp },
      hitSide: null,
      attackingSide: null,
    };

    const winnerAfterPlayer = isGameOver(afterPlayerAttack);
    if (winnerAfterPlayer) {
      setState({
        ...afterPlayerAttack,
        winner: winnerAfterPlayer,
      });
      if (onBattleEnd) onBattleEnd(winnerAfterPlayer);
      return;
    }

    setState(afterPlayerAttack);

    // 2. Enemy Turn
    await delay(1500); // Pause between turns
    const enemyMove = getRandomMove(state.enemy);

    // Show "Enemy used..."
    setState((s) => ({ ...s, turn: "enemy" }));
    await delay(1500); // Delay before enemy starts attack sequence
    setState((s) => ({
      ...s,
      log: [...s.log, `Enemy used ${enemyMove.name}!`],
    }));

    // Wait 1.5s after enemy log
    await delay(1500);
    setState((s) => ({ ...s, attackingSide: "enemy" }));

    // Trigger Hit + Damage
    await delay(400);
    setState((s) => ({ ...s, hitSide: "player", attackingSide: null }));

    const newPlayerHp = dealDamage(state.player.hp, enemyMove);
    const afterEnemyAttack: BattleState = {
      ...afterPlayerAttack,
      player: { ...state.player, hp: newPlayerHp },
      turn: "player",
      hitSide: null,
      attackingSide: null,
    };

    const winnerAfterEnemy = isGameOver(afterEnemyAttack);
    setState({ ...afterEnemyAttack, winner: winnerAfterEnemy });
    if (winnerAfterEnemy && onBattleEnd) onBattleEnd(winnerAfterEnemy);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "space-between",
        backgroundColor: "#1F2937",
      }}
    >
      <View
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 10 }}
      >
        {/* Enemy */}
        <PokemonCard
          pokemon={state.enemy}
          isAttacking={state.attackingSide === "enemy"}
          isHit={state.hitSide === "enemy"}
        />

        {/* Battle Log */}
        <View
          style={{ height: 50, justifyContent: "center", marginVertical: 40 }}
        >
          {state.log.slice(-2).map((l, i) => (
            <Text
              key={i}
              style={{
                textAlign: "center",
                fontWeight: "bold",
                color: "white",
              }}
            >
              {l}
            </Text>
          ))}

          {state.winner && (
            <Text
              style={{
                textAlign: "center",
                fontSize: 24,
                fontWeight: "bold",
                color: state.winner === "player" ? "#4CAF50" : "#F44336",
              }}
            >
              {state.winner === "player" ? "YOU WIN!" : "YOU LOSE!"}
            </Text>
          )}
        </View>

        {/* Player */}
        <PokemonCard
          pokemon={state.player}
          isBack={true}
          isAttacking={state.attackingSide === "player"}
          isHit={state.hitSide === "player"}
        />
      </View>

      {/* Battle Actions Menu */}
      <BattleActions
        moves={state.player.moves}
        onMovePress={attack}
        onBagPress={onBagPress}
        onRun={onRun}
        disabled={!!state.attackingSide || !!state.winner}
      />
    </View>
  );
}

export default function BattleScreen({ route, navigation }: BattleScreenProps) {
  const { player, enemy, onRun } = route.params;

  return (
    <Battle
      player={player}
      enemy={enemy}
      onBattleEnd={() => {
        // You might want to wait a bit before navigating back
        setTimeout(() => navigation.goBack(), 2000);
      }}
      onRun={onRun}
      onBagPress={() => navigation.navigate("InventoryBag", { pokemon: enemy })}
    />
  );
}
