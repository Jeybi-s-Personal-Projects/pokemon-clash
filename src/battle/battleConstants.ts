import { StatStages } from "./battleTypes";
import { Move } from "../types/pokemon";

export const initialStages: StatStages = {
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
  accuracy: 0,
  evasion: 0,
};

// ─── Charge-turn flavour messages ──────────────────────────────────────────
export const CHARGE_MESSAGES: Record<string, string> = {
  bounce: "sprang up high!",
  fly: "flew up high!",
  dig: "dug underground!",
  dive: "hid underwater!",
  "skull-bash": "tucked in its head!",
  "solar-beam": "took in sunlight!",
  "sky-attack": "is glowing!",
  "razor-wind": "whipped up a whirlwind!",
  "freeze-shock": "became cloaked in ice!",
  "ice-burn": "became cloaked in fire!",
};

// ─── Helper: convert a move's display name to the kebab-case lookup key ────
export const getMoveId = (move: Move): string => {
  // Prefer the id field if it exists on the move object
  if ((move as any).id) return (move as any).id as string;
  return move.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};
