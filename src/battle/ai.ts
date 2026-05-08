import { BATTLE_MOVES } from "../data/pokemon/moves/movesBattle";
import { Move, Pokemon } from "../types/pokemon";

/**
 * Heuristics-based AI for choosing the best move for an opponent.
 */
export function getAIMove(attacker: Pokemon, defender: Pokemon): Move {
  const hpPercent = (attacker.hp / attacker.maxHp) * 100;
  const movesWithData = attacker.moves.map((m) => ({
    move: m,
    data: BATTLE_MOVES[m.name.toLowerCase()],
  }));

  // 1. If HP is low, prioritize healing
  if (hpPercent < 40) {
    const healMove = movesWithData.find((m) => m.data?.category === "heal");
    if (healMove && healMove.move.pp > 0) return healMove.move;
  }

  // 2. If target has no status, try to inflict one
  if (!defender.status) {
    const statusMove = movesWithData.find((m) => m.data?.category === "status");
    if (statusMove && statusMove.move.pp > 0) return statusMove.move;
  }

  // 3. If attacker has high HP, try to boost stats
  if (hpPercent > 70) {
    const boostMove = movesWithData.find(
      (m) =>
        m.data?.category === "stat-change" &&
        m.data.effects.some((e) => e.target === "user"),
    );
    if (boostMove && boostMove.move.pp > 0) return boostMove.move;
  }

  // 4. Default: Highest power move that has PP
  const damagingMoves = attacker.moves
    .filter((m) => m.pp > 0)
    .sort((a, b) => (b.power || 0) - (a.power || 0));

  return damagingMoves[0] || attacker.moves[0];
}

/**
 * Simple random move selection (legacy/basic).
 */
export function getRandomMove(pokemon: Pokemon) {
  const index = Math.floor(Math.random() * pokemon.moves.length);
  return pokemon.moves[index];
}
