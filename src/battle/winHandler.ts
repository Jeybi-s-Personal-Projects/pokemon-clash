import { supabase } from "../lib/supabase";
import { Move, Pokemon } from "../types/pokemon";
import { BattleState } from "./battleTypes";
import { calculateExpGain, checkLevelUp } from "../utils/experienceCalculator";
import { delay } from "../utils/battleUtils";
import { fetchPokemon } from "../api/pokeApi";
import { checkEvolution } from "../utils/evolutionChecker";
import { calculateHp, calculateStat } from "../utils/statCalculator";

export type WinHandlerContext = {
  setCurrentMessage: (msg: string | null) => void;
  setState: (fn: (prev: BattleState) => BattleState) => void;
  promptMoveReplacement: (newMove: Move, pokemon: Pokemon) => Promise<Move[]>;
  setEvolvingPokemon: (data: any) => void;
  setEvolutionVisible: (v: boolean) => void;
  setResolveEvolution: (data: any) => void;
  revertMegaInTeam: (team: Pokemon[]) => Pokemon[];
  resetMegaState: () => void;
  onToggleAutoBattle?: (v: boolean) => void;
  onCheckpoint?: (team: Pokemon[]) => void;
  onBattleEnd?: (
    winner: "player" | "enemy",
    team: Pokemon[],
    hasMilestone: boolean,
    activeIndex: number,
  ) => void;
  defeatCount?: number;
};

export const handleWinner = async (
  winner: "player" | "enemy",
  currentState: BattleState,
  context: WinHandlerContext,
) => {
  const {
    setCurrentMessage,
    setState,
    promptMoveReplacement,
    setEvolvingPokemon,
    setEvolutionVisible,
    setResolveEvolution,
    revertMegaInTeam,
    resetMegaState,
    onToggleAutoBattle,
    onCheckpoint,
    onBattleEnd,
    defeatCount = 0,
  } = context;

  setState((s) => ({ ...currentState, winner }));

  if (winner === "player") {
    await delay(1200);
    setCurrentMessage(
      `The wild ${currentState.enemy.name.toUpperCase()} fainted!`,
    );

    // 1. Calculate base experience
    let baseExpGain = calculateExpGain(
      currentState.enemy.level,
      currentState.enemy.speciesId,
      true,
    );

    // 2. Add Milestone Bonus
    const currentDefeat = defeatCount + 1;
    if (currentDefeat % 10 === 0) {
      const n = currentDefeat / 10;
      const bonusXP = n * 1000;
      baseExpGain += bonusXP;

      await delay(1200);
      setCurrentMessage("MILESTONE REACHED!");
      await delay(1000);
      setCurrentMessage(`BONUS ${bonusXP} XP GRANTED TO TEAM!`);
      await delay(1200);
    }

    const finalTeam = [...currentState.team];
    let hasMilestone = false;
    const newMovesToSave: any[] = [];

    for (let i = 0; i < finalTeam.length; i++) {
      const p = finalTeam[i];
      if (p.hp <= 0) continue;

      const isActive = i === currentState.activePlayerIndex;
      const sharedExp = isActive
        ? baseExpGain
        : Math.floor(baseExpGain * 0.5);

      if (sharedExp <= 0) continue;

      const levelUp = checkLevelUp(p, sharedExp);
      let updatedPokemon = { ...p };

      if (levelUp) {
        hasMilestone = true;
        updatedPokemon = {
          ...p,
          level: levelUp.newLevel,
          experience: levelUp.totalExp,
          ...levelUp.stats,
        };

        await delay(1200);
        setCurrentMessage(`${p.name.toUpperCase()} gained ${sharedExp} EXP!`);
        await delay(1200);
        setCurrentMessage(
          `${p.name.toUpperCase()} grew to Level ${levelUp.newLevel}!`,
        );

        if (levelUp.newMoves.length > 0) {
          for (const move of levelUp.newMoves) {
            if (updatedPokemon.moves.length < 4) {
              updatedPokemon.moves = [...updatedPokemon.moves, move];
              await delay(1200);
              setCurrentMessage(
                `${updatedPokemon.name.toUpperCase()} learned ${move.name.toUpperCase()}!`,
              );

              newMovesToSave.push({
                pokemon_id: updatedPokemon.id,
                move_name: move.name,
                move_power: move.power,
                move_pp: move.pp,
                move_type: move.type ?? "normal",
                move_damageClass: move.damageClass,
                move_accuracy: move.accuracy,
                move_statChanges: JSON.stringify(move.statChanges),
                move_description: move.description,
                move_priority: move.priority,
              });
            } else {
              await delay(1200);
              setCurrentMessage(
                `${updatedPokemon.name.toUpperCase()} wants to learn ${move.name.toUpperCase()}...`,
              );
              await delay(1500);
              setCurrentMessage(`But it already knows 4 moves!`);
              await delay(1500);

              const newMoveset = await promptMoveReplacement(
                move,
                updatedPokemon,
              );
              updatedPokemon.moves = newMoveset;
            }
          }
        }

        const evolutionTargetId = checkEvolution(
          updatedPokemon,
          updatedPokemon.level,
        );
        if (evolutionTargetId) {
          setCurrentMessage(
            `What? ${updatedPokemon.name.toUpperCase()} is evolving!`,
          );
          await delay(2000);

          const newSpeciesData = await fetchPokemon(
            evolutionTargetId.toString(),
          );

          const evolve = new Promise<void>((resolve) => {
            setEvolvingPokemon({
              oldName: updatedPokemon.name,
              newSpeciesId: evolutionTargetId,
              newName: newSpeciesData.name,
              spriteUrl: newSpeciesData.sprites.other.showdown.front_default,
            });
            setEvolutionVisible(true);
            setResolveEvolution({ resolve });
          });

          await evolve;

          updatedPokemon = {
            ...updatedPokemon,
            speciesId: evolutionTargetId,
            name: newSpeciesData.name,
            type: newSpeciesData.types.map((t: any) => t.type.name),
            frontImage: newSpeciesData.sprites.other.showdown.front_default,
            backImage: newSpeciesData.sprites.other.showdown.back_default,
            hp: calculateHp(
              newSpeciesData.stats.find((s: any) => s.stat.name === "hp")
                .base_stat,
              updatedPokemon.level,
            ),
            maxHp: calculateHp(
              newSpeciesData.stats.find((s: any) => s.stat.name === "hp")
                .base_stat,
              updatedPokemon.level,
            ),
            attack: calculateStat(
              newSpeciesData.stats.find((s: any) => s.stat.name === "attack")
                .base_stat,
              updatedPokemon.level,
            ),
            defense: calculateStat(
              newSpeciesData.stats.find((s: any) => s.stat.name === "defense")
                .base_stat,
              updatedPokemon.level,
            ),
            specialAttack: calculateStat(
              newSpeciesData.stats.find(
                (s: any) => s.stat.name === "special-attack",
              ).base_stat,
              updatedPokemon.level,
            ),
            specialDefense: calculateStat(
              newSpeciesData.stats.find(
                (s: any) => s.stat.name === "special-defense",
              ).base_stat,
              updatedPokemon.level,
            ),
            speed: calculateStat(
              newSpeciesData.stats.find((s: any) => s.stat.name === "speed")
                .base_stat,
              updatedPokemon.level,
            ),
          };

          setCurrentMessage(
            `${updatedPokemon.name.toUpperCase()} evolved into ${newSpeciesData.name.toUpperCase()}!`,
          );
          await delay(2000);
        }
      } else {
        updatedPokemon.experience += sharedExp;
        if (isActive) {
          await delay(1200);
          setCurrentMessage(
            `${p.name.toUpperCase()} gained ${sharedExp} EXP!`,
          );
        }
      }

      finalTeam[i] = updatedPokemon;

      setState((s) => ({
        ...s,
        player: i === s.activePlayerIndex ? updatedPokemon : s.player,
        team: finalTeam,
      }));
    }

    if (newMovesToSave.length > 0) {
      const uniqueMoves = Array.from(
        new Map(
          newMovesToSave.map((m) => [`${m.pokemon_id}-${m.move_name}`, m]),
        ).values(),
      );
      const { error } = await supabase
        .from("pokemon_moves")
        .insert(uniqueMoves);
      if (error) console.error("Error batch saving moves:", error);
    }

    if (hasMilestone && onCheckpoint) {
      await onCheckpoint(finalTeam);
    }

    await delay(1500);

    const teamForEnd = revertMegaInTeam(finalTeam);
    resetMegaState();

    if (onBattleEnd)
      onBattleEnd(
        "player",
        teamForEnd,
        hasMilestone,
        currentState.activePlayerIndex,
      );
  } else {
    setCurrentMessage(`${currentState.player.name.toUpperCase()} fainted!`);
    setState((s) => ({ ...s, hitSide: "player" }));
    await delay(2000);

    const teamForEnd = revertMegaInTeam(currentState.team);
    resetMegaState();

    if (onBattleEnd)
      onBattleEnd("enemy", teamForEnd, false, currentState.activePlayerIndex);
  }
};
