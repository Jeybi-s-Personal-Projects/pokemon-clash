import React from "react";
import { Pokemon } from "../../types/pokemon";
import { PokemonSelectionModal } from "./PokemonSelectionModal";

interface SwitchModalProps {
  visible: boolean;
  team: Pokemon[];
  activeIndex: number;
  onSwitch: (index: number) => void;
  onClose: () => void;
  canCancel: boolean;
}

export const SwitchModal = ({
  visible,
  team,
  activeIndex,
  onSwitch,
  onClose,
  canCancel,
}: SwitchModalProps) => {
  return (
    <PokemonSelectionModal
      visible={visible}
      title="Choose a Pokémon:"
      subtitle={!canCancel ? "Your Pokémon fainted! Switch now." : undefined}
      team={team}
      activeIndex={activeIndex}
      onSelect={onSwitch}
      onClose={onClose}
      canCancel={canCancel}
      filter={(p) => p.hp > 0} // Standard switch only allows non-fainted
    />
  );
};
