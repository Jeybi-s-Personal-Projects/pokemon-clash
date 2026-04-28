import { Pokemon } from "../types/pokemon";

export type BattleState = {
  player: Pokemon;
  enemy: Pokemon;
  turn: "player" | "enemy";
  log: string[];
  winner: "player" | "enemy" | null;
  attackingSide: "player" | "enemy" | null;
  dancingSide: "player" | "enemy" | null;
  hitSide: "player" | "enemy" | null;
};
