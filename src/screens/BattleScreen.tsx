import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { OpponentInfoModal } from "@/src/components/battle/OpponentInfoModal";
import { PokemonStatsModal } from "@/src/components/PokemonStatsModal";
import { MegaEvolutionOverlay } from "@/src/components/battle/MegaEvolutionOverlay";
import { BattleField } from "../components/battle/BattleField";
import { MoveLearningModal } from "../components/battle/MoveLearningModal";
import { SwitchModal } from "../components/battle/SwitchModal";
import { WeatherIndicator } from "../components/battle/WeatherIndicator";
import BattleActions from "../components/battleActions";
import EvolutionModal from "../components/evolutionModal";
import StatusModal from "../components/statusModal";
import { useBattle } from "../hooks/useBattle";
import { BattleScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";

import { setAudioModeAsync } from "expo-audio";

// ─── Inner Battle component ──────────────────────────────────────────────────

interface BattleProps {
  player: Pokemon;
  team: Pokemon[];
  enemy: Pokemon;
  onBattleEnd?: (
    winner: "player" | "enemy",
    finalTeam: Pokemon[],
    didEvolve: boolean,
    activeIndex: number,
  ) => void;
  onCheckpoint?: (finalTeam: Pokemon[]) => void;
  onRun?: (finalTeam: Pokemon[]) => void;
  // In Battle component, change onBagPress prop type:
  onBagPress?: (
    player: Pokemon,
    team: Pokemon[],
    currentEnemy: Pokemon,
    onCatchFailed: () => void,
  ) => void;
  catchPending?: { item: { id: string; name: string; catchRate: number } };
  onSave?: () => void;
  isAutoBattle?: boolean;
  onToggleAutoBattle?: (v: boolean) => void;
  catchFailed?: boolean;
  onClearCatchFailed?: () => void;
}

export function Battle({
  player,
  team,
  enemy,
  onBattleEnd,
  onCheckpoint,
  onRun,
  onBagPress,
  catchPending,
  onSave,
  isAutoBattle = false,
  onToggleAutoBattle,
  catchFailed,
  onClearCatchFailed,
}: BattleProps) {
  const battle = useBattle({
    player,
    team,
    enemy,
    onBattleEnd,
    onCheckpoint,
    onSave,
    catchPending,
    onToggleAutoBattle,
  });

  const { state, currentMessage } = battle;
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // Handle Turn Penalty from CatchingScreen
  useEffect(() => {
    if (catchFailed) {
      const timer = setTimeout(() => {
        battle.processTurnPenalty();
        onClearCatchFailed?.();
      }, 500); // 500ms delay to allow component state to settle
      return () => clearTimeout(timer);
    }
  }, [catchFailed]);

  return (
    <View style={styles.container}>
      <MegaEvolutionOverlay 
        visible={battle.isMegaEvolving} 
        pokemon={state.player}
      />
      {/* 0. Weather Indicator */}
      <WeatherIndicator weather={state.weather} turns={state.weatherTurns} />

      {/* 1. The Battle Field (Sprites & HP) */}
      <BattleField
        player={state.player}
        enemy={state.enemy}
        playerStages={state.playerStages}
        enemyStages={state.enemyStages}
        attackingSide={state.attackingSide}
        dancingSide={state.dancingSide}
        hitSide={state.hitSide}
        floatingDamage={state.floatingDamage}
        isPlayerEntering={battle.isPlayerEntering}
        onEnemyPress={() => setInfoModalVisible(true)}
        onPlayerPress={() => setStatsModalVisible(true)}
      />

      <OpponentInfoModal
        visible={infoModalVisible}
        pokemon={state.enemy}
        onClose={() => setInfoModalVisible(false)}
      />

      <PokemonStatsModal
        visible={statsModalVisible}
        pokemon={state.player}
        stages={state.playerStages}
        onClose={() => setStatsModalVisible(false)}
      />

      {/* 2. Action Menu / Log */}
      <BattleActions
        moves={state.player.moves}
        playerTypes={state.player.type}
        enemyTypes={state.enemy.type}
        onMovePress={battle.attack}
        onPokemonPress={() => battle.setSwitchModalVisible(true)}
        onBagPress={() =>
          onBagPress?.(
            state.player,
            state.team,
            state.enemy,
            () => battle.processTurnPenalty(), // pass penalty as callback
          )
        }
        onRun={() => onRun?.(battle.revertMegaInTeam(state.team))}
        onMegaEvolve={battle.handleMegaEvolution}
        canMegaEvolve={battle.canMegaEvolve}
        disabled={
          !!state.attackingSide ||
          !!state.dancingSide ||
          !!state.winner ||
          !!currentMessage
        }
        currentLog={currentMessage}
        isAutoBattle={isAutoBattle}
        onToggleAutoBattle={onToggleAutoBattle}
      />

      {/* 3. Utility Modals */}
      <StatusModal
        visible={battle.statusVisible}
        message={battle.statusMessage}
        type="success"
        onClose={battle.handleStatusClose}
      />

      <EvolutionModal
        visible={battle.evolutionVisible}
        pokemon={battle.evolvingPokemon}
        onClose={() => {
          battle.setEvolutionVisible(false);
          battle.resolveEvolution?.resolve();
        }}
      />

      <SwitchModal
        visible={battle.switchModalVisible}
        team={state.team}
        activeIndex={state.activePlayerIndex}
        onSwitch={battle.handleSwitch}
        onClose={() => battle.setSwitchModalVisible(false)}
        canCancel={state.player.hp > 0}
      />

      <MoveLearningModal
        visible={battle.moveModalVisible}
        pokemon={battle.learningPokemon || state.player}
        newMove={battle.pendingMove}
        onSelect={battle.handleMoveSelection}
      />
    </View>
  );
}

// ─── BattleScreen Wrapper ──────────────────────────────────────────────────

export default function BattleScreen({ route, navigation }: BattleScreenProps) {
  const {
    player,
    team,
    enemy,
    onRun,
    onBattleEnd: onBattleEndProp,
    onCheckpoint,
    isAutoBattle,
    onToggleAutoBattle,
    catchFailed,
  } = route.params as any;

  const catchPending = route.params.catchPending;
  const onSave = (route.params as any).onSave;

  useEffect(() => {
    if (catchPending) {
      const timer = setTimeout(() => {
        navigation.setParams({ catchPending: undefined } as any);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [catchPending]);

  return (
    <Battle
      player={player}
      team={team || [player]}
      enemy={enemy}
      catchPending={catchPending}
      onSave={onSave}
      onBattleEnd={(winner, finalTeam, didEvolve, activeIndex) => {
        if (onBattleEndProp)
          onBattleEndProp(winner, finalTeam, didEvolve, activeIndex);
        else setTimeout(() => navigation.goBack(), 2000);
      }}
      onCheckpoint={onCheckpoint}
      onRun={(finalTeam) => {
        if (onRun) onRun(finalTeam);
        else navigation.goBack();
      }}
      onBagPress={(p, t, e, onCatchFailed) =>
        navigation.navigate("InventoryBag", {
          player: p,
          team: t,
          pokemon: e,
          fromScreen: "Battle",
          onCatchFailed,
          revertMegaInTeam: battle.revertMegaInTeam,
          isMega: battle.isMega,
        } as any)
      }

      isAutoBattle={isAutoBattle}
      onToggleAutoBattle={onToggleAutoBattle}
      catchFailed={catchFailed}
      onClearCatchFailed={() =>
        navigation.setParams({ catchFailed: undefined } as any)
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
  },
});
