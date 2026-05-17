import * as Crypto from "expo-crypto";
import { fetchPokemon } from "../api/pokeApi";
import db from "../lib/db";
import { Move, Pokemon } from "../types/pokemon";
import { delay } from "../utils/battleUtils";
import { checkEvolution } from "../utils/evolutionChecker";
import { calculateExpGain, checkLevelUp } from "../utils/experienceCalculator";
import { calculateHp, calculateStat } from "../utils/statCalculator";
import { BattleState } from "./battleTypes";

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
  playMilestoneSound?: () => void;
  userId?: string;
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
    onCheckpoint,
    onBattleEnd,
    defeatCount = 0,
    playMilestoneSound,
    userId,
  } = context;

  setState((s) => ({ ...currentState, winner }));

  // Update total battles
  if (userId) {
    db.runSync(
      `INSERT INTO trainer_stats (user_id, total_battles) 
       VALUES (?, 1) 
       ON CONFLICT(user_id) DO UPDATE SET total_battles = total_battles + 1, updated_at = CURRENT_TIMESTAMP`,
      [userId]
    );
  }

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

    // 2. Add PokeCoins Reward
    if (userId) {
      const currentStreak = defeatCount; // defeatCount from EncounterFlow is the number of opponents ALREADY defeated
      const coinsEarned = Math.floor((baseExpGain * 6) * 0.05 * (1 + (currentStreak / 10)));
      
      db.runSync(
        `UPDATE trainer_stats 
         SET pokecoins = pokecoins + ?, 
             total_wins = total_wins + ?,
             highest_streak = MAX(highest_streak, ?),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [coinsEarned, 1, currentStreak + 1, userId]
      );

      await delay(1200);
      setCurrentMessage(`You earned ${coinsEarned} PokéCoins!`);
      await delay(1200);
    }

    // 3. Add Milestone Bonus
    const currentDefeat = defeatCount + 1;
    if (currentDefeat % 10 === 0) {
      const n = currentDefeat / 10;
      const bonusXP = n * 1000;
      baseExpGain += bonusXP;

      await delay(1200);
      playMilestoneSound?.();
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
      const sharedExp = isActive ? baseExpGain : Math.floor(baseExpGain * 0.5);

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
        playMilestoneSound?.();
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
              spriteUrl: updatedPokemon.isShiny
                ? newSpeciesData.sprites.other.showdown.front_shiny ||
                  newSpeciesData.sprites.other.showdown.front_default
                : newSpeciesData.sprites.other.showdown.front_default,
            });
            setEvolutionVisible(true);
            setResolveEvolution({ resolve });
          });

          await evolve;
          playMilestoneSound?.();

          const showdown = newSpeciesData.sprites.other.showdown;
          updatedPokemon = {
            ...updatedPokemon,
            speciesId: evolutionTargetId,
            name: newSpeciesData.name,
            type: newSpeciesData.types.map((t: any) => t.type.name),
            frontImage: updatedPokemon.isShiny
              ? showdown.front_shiny || showdown.front_default
              : showdown.front_default,
            backImage: updatedPokemon.isShiny
              ? showdown.back_shiny || showdown.back_default
              : showdown.back_default,
            hp: calculateHp(              newSpeciesData.stats.find((s: any) => s.stat.name === "hp")
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
          setCurrentMessage(`${p.name.toUpperCase()} gained ${sharedExp} EXP!`);
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
      for (const m of newMovesToSave) {
        db.runSync(
          `INSERT INTO pokemon_moves (
            id, pokemon_id, move_name, move_power, move_pp, 
            move_type, move_damageClass, move_accuracy, 
            move_statChanges, move_description, move_priority
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            Crypto.randomUUID(),
            m.pokemon_id,
            m.move_name,
            m.move_power,
            m.move_pp,
            m.move_type,
            m.move_damageClass,
            m.move_accuracy,
            m.move_statChanges,
            m.move_description,
            m.move_priority,
          ],
        );
      }
    }

    if (hasMilestone && onCheckpoint) {
      await onCheckpoint(finalTeam);
    }

    // Ensure state is fully synced before finalizing
    setState((s) => ({
      ...s,
      player: finalTeam[currentState.activePlayerIndex],
      team: finalTeam,
    }));

    const teamForEnd = revertMegaInTeam(finalTeam);
    resetMegaState();

    await delay(1500);

    if (onBattleEnd) {
      onBattleEnd(
        "player",
        teamForEnd,
        hasMilestone,
        currentState.activePlayerIndex,
      );
    }
  } else {
    setCurrentMessage(`${currentState.player.name.toUpperCase()} fainted!`);
    setState((s) => ({ ...s, hitSide: "player" }));
    await delay(2000);

    const teamForEnd = revertMegaInTeam(currentState.team);
    resetMegaState();

    if (onBattleEnd) {
      onBattleEnd("enemy", teamForEnd, false, currentState.activePlayerIndex);
    }
  }
};
