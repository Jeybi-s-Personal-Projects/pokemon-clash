import { useState } from "react";
import { Move, Pokemon } from "../../types/pokemon";
import { supabase } from "../../lib/supabase";
import { delay } from "../../utils/battleUtils";

export function useMoveLearning(
  userId: string | undefined,
  setCurrentMessage: (msg: string | null) => void,
  onToggleAutoBattle?: (v: boolean) => void,
) {
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [pendingMove, setPendingMove] = useState<Move | null>(null);
  const [learningPokemon, setLearningPokemon] = useState<Pokemon | null>(null);
  const [resolveMoveLearning, setResolveMoveLearning] = useState<{
    resolve: (updatedMoves: Move[]) => void;
  } | null>(null);

  const promptMoveReplacement = (
    newMove: Move,
    pokemon: Pokemon,
  ): Promise<Move[]> => {
    return new Promise((resolve) => {
      setLearningPokemon(pokemon);
      setPendingMove(newMove);
      setMoveModalVisible(true);
      setResolveMoveLearning({ resolve });
    });
  };

  const handleMoveSelection = async (index: number | "skip") => {
    if (!resolveMoveLearning || !pendingMove || !learningPokemon) return;

    let updatedMoves = [...learningPokemon.moves];

    if (index !== "skip") {
      const oldMove = updatedMoves[index];
      updatedMoves[index] = { ...pendingMove };

      if (userId && learningPokemon.id) {
        await supabase
          .from("pokemon_moves")
          .delete()
          .eq("pokemon_id", learningPokemon.id)
          .eq("move_name", oldMove.name);

        await supabase.from("pokemon_moves").insert({
          pokemon_id: learningPokemon.id,
          move_name: pendingMove.name,
          move_power: pendingMove.power,
          move_pp: pendingMove.pp,
          move_type: pendingMove.type ?? "normal",
          move_damageClass: pendingMove.damageClass,
          move_accuracy: pendingMove.accuracy,
          move_statChanges: JSON.stringify(pendingMove.statChanges),
          move_description: pendingMove.description,
          move_priority: pendingMove.priority,
        });
      }

      setCurrentMessage(
        `${learningPokemon.name.toUpperCase()} forgot ${oldMove.name.toUpperCase()} and learned ${pendingMove.name.toUpperCase()}!`,
      );
    } else {
      setCurrentMessage(
        `${learningPokemon.name.toUpperCase()} did not learn ${pendingMove.name.toUpperCase()}.`,
      );
    }

    setMoveModalVisible(false);
    await delay(1500);
    resolveMoveLearning.resolve(updatedMoves);
    setPendingMove(null);
    setLearningPokemon(null);
    setResolveMoveLearning(null);
  };

  return {
    moveModalVisible,
    pendingMove,
    learningPokemon,
    promptMoveReplacement,
    handleMoveSelection,
  };
}
