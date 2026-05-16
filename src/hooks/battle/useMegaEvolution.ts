import { processSwitchInAbilities } from "../../battle/abilityHandler";
import { applyMegaEvolution } from "../../utils/megaEvolutionUtils";
import { delay } from "../../utils/battleUtils";
import { useState, useEffect } from "react";
import { Pokemon } from "../../types/pokemon";
import { MEGA_STATS } from "../../data/pokemon/stats/megaStats";

export function useMegaEvolution(
  player: Pokemon,
  activePlayerIndex: number,
  team: Pokemon[],
  setState: React.Dispatch<React.SetStateAction<any>>,
  setCurrentMessage: (msg: string | null) => void,
) {
  const [canMegaEvolve, setCanMegaEvolve] = useState(false);
  const [isMega, setIsMega] = useState(false);
  const [isMegaEvolving, setIsMegaEvolving] = useState(false);
  const [basePlayer, setBasePlayer] = useState<Pokemon | null>(null);

  // Check for mega evolution on switch or initialization
  useEffect(() => {
    if (!isMega && player.heldItem && MEGA_STATS[player.heldItem]) {
      setCanMegaEvolve(true);
    } else {
      setCanMegaEvolve(false);
    }
  }, [player.id, player.heldItem, isMega]);

  const handleMegaEvolution = async () => {
    if (!canMegaEvolve || isMegaEvolving) return;

    setIsMegaEvolving(true);
    setBasePlayer(player);

    const evolvedPokemon = await applyMegaEvolution(player);

    const nextTeam = [...team];
    nextTeam[activePlayerIndex] = evolvedPokemon;

    // First update the state to reflect the evolution
    setState((prev: any) => ({
      ...prev,
      player: evolvedPokemon,
      team: nextTeam,
    }));

    setIsMega(true);
    setCanMegaEvolve(false);
    setCurrentMessage(`${evolvedPokemon.name.toUpperCase()} has Mega Evolved!`);

    await delay(2000);

    // Now process the new ability as a switch-in effect
    // We need to fetch the *latest* state to ensure we're processing the updated player
    let abilityMessages: string[] = [];
    setState((prev: any) => {
        processSwitchInAbilities("player", prev).then((result) => {
            setState((p: any) => ({
                ...p,
                ...result.newState,
            }));
            abilityMessages = result.messages;
        });
        return prev;
    });

    await delay(1000);
    for (const msg of abilityMessages) {
        setCurrentMessage(msg);
        await delay(2000);
    }

    setCurrentMessage(null);
    setIsMegaEvolving(false);
  };
// ... rest of the file

  const revertPokemon = (p: Pokemon): Pokemon => {
    if (basePlayer && p.id === basePlayer.id && p.name.includes("Mega ")) {
      return { 
        ...basePlayer, 
        hp: Math.min(p.hp, basePlayer.maxHp), 
        maxHp: basePlayer.maxHp 
      };
    }
    return p;
  };

  const revertMegaInTeam = (teamToRevert: Pokemon[]): Pokemon[] => {
    if (!isMega || !basePlayer) return teamToRevert;
    return teamToRevert.map(revertPokemon);
  };

  const resetMegaState = () => {
    setIsMega(false);
    setBasePlayer(null);
  };

  return {
    canMegaEvolve,
    isMega,
    isMegaEvolving,
    basePlayer,
    setBasePlayer,
    handleMegaEvolution,
    revertMegaInTeam,
    resetMegaState,
    setIsMega,
  };
}
