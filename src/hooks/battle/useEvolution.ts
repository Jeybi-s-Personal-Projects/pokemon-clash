import { useState } from "react";

export function useEvolution() {
  const [evolutionVisible, setEvolutionVisible] = useState(false);
  const [evolvingPokemon, setEvolvingPokemon] = useState<{
    oldName: string;
    newSpeciesId: number;
    newName: string;
    spriteUrl: string;
  } | null>(null);
  const [resolveEvolution, setResolveEvolution] = useState<{
    resolve: () => void;
  } | null>(null);

  return {
    evolutionVisible,
    setEvolutionVisible,
    evolvingPokemon,
    setEvolvingPokemon,
    resolveEvolution,
    setResolveEvolution,
  };
}
