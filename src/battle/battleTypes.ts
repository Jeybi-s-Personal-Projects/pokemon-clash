import { Pokemon } from "../types/pokemon";

export type StatStages = {
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  accuracy: number;
  evasion: number;
};

export type WeatherCondition = "rain" | "sun" | "sandstorm" | "hail" | null;

export type TrapState = {
  moveId: string;
  turnsLeft: number;
  damagePerTurn: number; // fraction of maxHp e.g. 0.125
};

export type ChargeState = {
  moveId: string; // e.g. "bounce", "fly", "dig"
  executeNextTurn: boolean;
};

export type BattleState = {
  // ── Core ──────────────────────────────────────────────
  player: Pokemon;
  team: Pokemon[];
  activePlayerIndex: number;
  enemy: Pokemon;
  turn: "player" | "enemy";
  log: string[];
  winner: "player" | "enemy" | null;

  // ── Animation flags ───────────────────────────────────
  attackingSide: "player" | "enemy" | null;
  dancingSide: "player" | "enemy" | null;
  hitSide: "player" | "enemy" | null;

  // ── Stat stages ───────────────────────────────────────
  playerStages: StatStages;
  enemyStages: StatStages;

  // ── Weather ───────────────────────────────────────────
  weather: WeatherCondition;
  weatherTurns: number;
  chargingMove: {
    move: string;
    target: string;
    attacker: "player" | "enemy";
  } | null;

  // ── Charge moves (Fly, Bounce, Dig, Solar Beam, etc.) ─
  playerCharge?: ChargeState;
  enemyCharge?: ChargeState;

  // ── Trapping moves (Wrap, Bind, Fire Spin, etc.) ──────
  playerTrap?: TrapState;
  enemyTrap?: TrapState;

  // ── Volatile per-turn flags ───────────────────────────
  playerFlinched: boolean;
  enemyFlinched: boolean;
  playerProtected: boolean;
  enemyProtected: boolean;

  // ── Bad poison (Toxic) tracking ───────────────────────
  playerBadPoison: boolean;
  enemyBadPoison: boolean;
};
