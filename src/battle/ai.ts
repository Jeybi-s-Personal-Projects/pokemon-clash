import { BATTLE_MOVES } from "../data/pokemon/moves/movesBattle";
import { Move, Pokemon } from "../types/pokemon";

/**
 * Heuristics-based AI for choosing the best move for an opponent.
 */
export function getAIMove(attacker: Pokemon, defender: Pokemon): Move {
  const hpPercent = (attacker.hp / attacker.maxHp) * 100;
  
  // Filter moves that have PP left and are not "unique" category
  const availableMoves = attacker.moves.filter((m) => m.pp > 0 && BATTLE_MOVES[m.name.toLowerCase()]?.category !== "unique");
  
  const movesWithData = availableMoves.map((m) => ({
    move: m,
    data: BATTLE_MOVES[m.name.toLowerCase()],
  }));

  // 1. If HP is low, prioritize healing
  if (hpPercent < 40) {
    const healMove = movesWithData.find((m) => m.data?.category === "heal");
    if (healMove) return healMove.move;
  }

  // 2. If target has no status, try to inflict one
  if (!defender.status) {
    const statusMove = movesWithData.find((m) => m.data?.category === "status");
    if (statusMove) return statusMove.move;
  }

  // 3. If attacker has high HP, try to boost stats
  if (hpPercent > 70) {
    const boostMove = movesWithData.find(
      (m) =>
        m.data?.category === "stat-change" &&
        m.data.effects.some((e) => e.target === "user"),
    );
    if (boostMove) return boostMove.move;
  }

  // 4. Default: Highest power move available
  const damagingMoves = movesWithData
    .sort((a, b) => (b.data?.power || 0) - (a.data?.power || 0));

  if (damagingMoves.length > 0) return damagingMoves[0].move;

  // 5. Fallback to Struggle if no moves have PP
  return {
    name: "struggle",
    power: 50,
    pp: 1,
    maxPp: 1,
    damageClass: "physical",
    type: "normal",
    accuracy: 100,
    description: "An all-out attack that also hurts the user.",
  };
}

/**
 * Simple random move selection (legacy/basic).
 */
export function getRandomMove(pokemon: Pokemon) {
  const availableMoves = pokemon.moves.filter(
    (m) => BATTLE_MOVES[m.name.toLowerCase()]?.category !== "unique",
  );
  if (availableMoves.length === 0) return pokemon.moves[0];
  const index = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[index];
}
