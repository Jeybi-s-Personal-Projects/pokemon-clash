import { Move } from "../types/pokemon";
import { BattleState } from "./battleTypes";
import { getTypeMultiplier, PokemonType } from "./typeChart";

export function dealDamage(
  defenderHp: number,
  move: Move,
  defenderTypes: string[],
): number {
  const moveType = (move.type || "normal") as PokemonType;
  const multiplier = getTypeMultiplier(moveType, defenderTypes as PokemonType[]);
  const damage = Math.floor(move.power * multiplier);
  return Math.max(defenderHp - damage, 0);
}

export function isGameOver(state: BattleState) {
  if (state.enemy.hp <= 0) return "player";
  if (state.player.hp <= 0) return "enemy";
  return null;
}
