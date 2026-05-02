import { StatusCondition } from "../types/pokemon";

export type StatusEffect = {
  status: StatusCondition;
  chance: number; // 0-100
  isVolatile?: boolean;
};

/**
 * Mapping of move names to their status effects.
 * This handles the logic that isn't explicitly detailed in the raw moves data.
 */
export const MOVE_STATUS_MAP: Record<string, StatusEffect> = {
  // Paralysis
  "thunder-wave": { status: "paralysis", chance: 100 },
  "stun-spore": { status: "paralysis", chance: 75 },
  "thunder": { status: "paralysis", chance: 30 },
  "thunderbolt": { status: "paralysis", chance: 10 },
  "thunder-punch": { status: "paralysis", chance: 10 },
  "thunder-shock": { status: "paralysis", chance: 10 },
  "body-slam": { status: "paralysis", chance: 30 },
  "lick": { status: "paralysis", chance: 30 },
  "spark": { status: "paralysis", chance: 30 },

  // Poison
  "toxic": { status: "poison", chance: 100 },
  "poison-powder": { status: "poison", chance: 75 },
  "poison-sting": { status: "poison", chance: 30 },
  "sludge-bomb": { status: "poison", chance: 30 },
  "poison-jab": { status: "poison", chance: 30 },
  "acid": { status: "poison", chance: 10 },

  // Burn
  "will-o-wisp": { status: "burn", chance: 85 },
  "fire-blast": { status: "burn", chance: 10 },
  "flamethrower": { status: "burn", chance: 10 },
  "fire-punch": { status: "burn", chance: 10 },
  "ember": { status: "burn", chance: 10 },
  "flame-wheel": { status: "burn", chance: 10 },

  // Sleep
  "spore": { status: "sleep", chance: 100 },
  "sleep-powder": { status: "sleep", chance: 75 },
  "hypnosis": { status: "sleep", chance: 60 },
  "sing": { status: "sleep", chance: 55 },

  // Freeze
  "blizzard": { status: "freeze", chance: 10 },
  "ice-beam": { status: "freeze", chance: 10 },
  "ice-punch": { status: "freeze", chance: 10 },

  // Confusion (Volatile)
  "confuse-ray": { status: null, chance: 100, isVolatile: true },
  "supersonic": { status: null, chance: 55, isVolatile: true },
  "sweet-kiss": { status: null, chance: 75, isVolatile: true },
  "dynamic-punch": { status: null, chance: 100, isVolatile: true },
  "water-pulse": { status: null, chance: 20, isVolatile: true },
  "confusion": { status: null, chance: 10, isVolatile: true },
  "psybeam": { status: null, chance: 10, isVolatile: true },
};

/**
 * Returns a random number of turns for a status to last.
 */
export const getStatusDuration = (status: StatusCondition | "confusion"): number => {
  switch (status) {
    case "sleep":
      return Math.floor(Math.random() * 3) + 1; // 1-3 turns
    case "confusion":
      return Math.floor(Math.random() * 4) + 2; // 2-5 turns
    default:
      return 0;
  }
};
