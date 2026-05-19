import { useState } from "react";
import { BattleState } from "../../battle/battleTypes";
import { Pokemon } from "../../types/pokemon";
import { delay } from "../../utils/battleUtils";

export function useTerastalization(
  activePlayer: Pokemon,
  activePlayerIndex: number,
  team: Pokemon[],
  setState: React.Dispatch<React.SetStateAction<BattleState>>,
  setCurrentMessage: (msg: string | null) => void,
) {
  const [isTeraModalVisible, setTeraModalVisible] = useState(false);

  const canTerastalize = (pokemon: Pokemon, isTeraUsed: boolean) => {
    return !isTeraUsed && !pokemon.isTerastalized && pokemon.hp > 0;
  };

  const handleTerastalize = async (chosenType: string) => {
    setTeraModalVisible(false);
    setCurrentMessage(`${activePlayer.name.toUpperCase()} is Terastalizing!`);
    await delay(1500);

    const updatedPokemon: Pokemon = {
      ...activePlayer,
      originalTypes: [...activePlayer.type],
      type: [chosenType],
      isTerastalized: true,
      teraType: chosenType,
    };

    const updatedTeam = [...team];
    updatedTeam[activePlayerIndex] = updatedPokemon;

    setState((s) => ({
      ...s,
      player: updatedPokemon,
      team: updatedTeam,
      isTeraUsed: true,
    }));

    setCurrentMessage(`${activePlayer.name.toUpperCase()} transformed into the ${chosenType.toUpperCase()} type!`);
    await delay(1500);
    setCurrentMessage(null);
  };

  const revertTerastalization = (pokemon: Pokemon): Pokemon => {
    if (!pokemon.isTerastalized || !pokemon.originalTypes) return pokemon;
    return {
      ...pokemon,
      type: pokemon.originalTypes,
      isTerastalized: false,
      teraType: undefined,
      originalTypes: undefined,
    };
  };

  const revertTeraInTeam = (team: Pokemon[]): Pokemon[] => {
    return team.map((p) => revertTerastalization(p));
  };

  return {
    isTeraModalVisible,
    setTeraModalVisible,
    canTerastalize,
    handleTerastalize,
    revertTerastalization,
    revertTeraInTeam,
  };
}
