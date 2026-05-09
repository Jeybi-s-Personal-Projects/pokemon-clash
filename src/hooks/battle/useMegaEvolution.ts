import { useState, useEffect } from "react";
import { Pokemon } from "../../types/pokemon";
import { MEGA_STATS } from "../../data/pokemon/stats/megaStats";
import { applyMegaEvolution } from "../../utils/megaEvolutionUtils";
import { delay } from "../../utils/battleUtils";

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

    setState((prev: any) => ({
      ...prev,
      player: evolvedPokemon,
      team: nextTeam,
    }));

    setIsMega(true);
    setCanMegaEvolve(false);
    setCurrentMessage(`${evolvedPokemon.name.toUpperCase()} has Mega Evolved!`);

    await delay(5000);

    setCurrentMessage(null);
    setIsMegaEvolving(false);
  };

  const revertMegaInTeam = (teamToRevert: Pokemon[]): Pokemon[] => {
    if (!isMega || !basePlayer) return teamToRevert;

    return teamToRevert.map((p) => {
      if (p.id === basePlayer.id && p.name.includes("Mega ")) {
        return { ...basePlayer, hp: p.hp, maxHp: basePlayer.maxHp };
      }
      return p;
    });
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
