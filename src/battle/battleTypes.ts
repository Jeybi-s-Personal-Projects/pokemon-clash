import { Pokemon } from "../types/pokemon";

export type StatStages = {
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
};

export type WeatherCondition = "rain" | "sun" | "sandstorm" | "hail" | null;

export type BattleState = {
  player: Pokemon;
  team: Pokemon[];
  activePlayerIndex: number;
  enemy: Pokemon;
  turn: "player" | "enemy";
  log: string[];
  winner: "player" | "enemy" | null;
  attackingSide: "player" | "enemy" | null;
  dancingSide: "player" | "enemy" | null;
  hitSide: "player" | "enemy" | null;
  playerStages: StatStages;
  enemyStages: StatStages;
  weather: WeatherCondition;
  weatherTurns: number;
};
