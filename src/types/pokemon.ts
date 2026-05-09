import { GrowthRate } from "../data/level/growthRates";

export type Move = {
  id?: string; // Database primary key
  name: string;
  power: number;
  pp: number;
  maxPp: number;
  damageClass?: string;
  type?: string;
  accuracy?: number | null;
  statChanges?: { stat: string; change: number }[];
  description?: string | null;
  priority?: number | null;
};

export type StatusCondition =
  | "poison"
  | "burn"
  | "paralysis"
  | "sleep"
  | "freeze"
  | null;

export type Pokemon = {
  id?: number | string;
  speciesId: number;
  pk_order?: number;
  name: string;
  level: number;
  experience: number;
  growthRate?: GrowthRate;
  type: string[];
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  frontImage: string;
  backImage: string;
  isShiny?: boolean;
  ability?: string;
  heldItem?: string;
  moves: Move[];
  cry: string;
  status?: StatusCondition;
  statusTurns?: number; // For sleep
  confusionTurns?: number; // Volatile status

  // pokemon.ts — add to Pokemon type:
  flinched?: boolean; // cleared each turn start
  badPoisonTurns?: number; // escalating toxic counter
};
