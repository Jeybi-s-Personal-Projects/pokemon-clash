export type EncounterEntry = {
  id: number;
  rate: number;
  levels: { min: number; max: number };
  shinyRate?: number;
};

export type EncounterTable = EncounterEntry[];

export type GeneratedEncounter = {
  id: number;
  level: number;
  isShiny: boolean;
};

export type RawMove = {
  name: string;
  url: string;
  levelLearned: number;
};

export type MoveDetail = {
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  type: string;
  damageClass: "physical" | "special" | "status";
  effectChance: number | null;
  statChanges: { stat: string; change: number }[];
  description: string | null;
  priority: number;
};

export type SelectedMove = {
  name: string;
  url: string;
  levelLearned: number;
};

export type BaseStats = {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
};

// What gets stored in the cache — raw API data only, never filtered moves
export type PokemonRawData = {
  baseStats: BaseStats;
  rawMoves: RawMove[];
  name?: string;
  types?: string[];
};

// What the battle screen receives — constructed at dequeue time, never cached
export type EncounterPokemon = {
  id: number;
  name: string;
  types: string[];
  image: string;
  backImage: string;
  level: number;
  isShiny: boolean;
  baseStats: BaseStats;
  moves: SelectedMove[]; // output of selectMoves — NEVER stored in cache
};

export type QueueEntry = GeneratedEncounter & {
  rawData: PokemonRawData;
};
