import { StatStages } from "../battle/battleTypes";

export type MoveCategory =
  | "damage"
  | "damage+status"
  | "damage+stat"
  | "damage+stat-change"
  | "damage+drain"
  | "damage+recoil"
  | "damage+charge"
  | "damage+trap"
  | "damage+multi"
  | "damage+self-faint"
  | "status"
  | "stat-change"
  | "weather"
  | "heal"
  | "field-effect"
  | "multi-hit"
  | "ohko"
  | "self-faint"
  | "unique";

export type MoveTarget =
  | "user"
  | "target"
  | "all-enemies"
  | "all-allies"
  | "field";

export type StatName = keyof StatStages | "accuracy" | "evasion";

export type TrapState = {
  moveId: string;
  turnsLeft: number;
  damagePerTurn: number; // fraction of maxHp e.g. 0.125
};

export type ChargeState = {
  moveId: string; // e.g. "bounce", "fly", "dig"
  executeNextTurn: boolean;
};

export type MoveEffect = {
  type:
    | "status" // value = StatusCondition string (burn/paralyze/sleep/freeze/poison/bad-poison/flinch/confusion)
    | "stat-change" // value = Partial<StatStages & {accuracy, evasion}>
    | "weather" // value = WeatherCondition
    | "heal" // value = number (% of maxHp)
    | "drain" // value = number (% of damage dealt)
    | "recoil" // value = number (% of maxHp)
    | "trap" // value = { turns: [min,max]|number, damagePerTurn: number }
    | "charge" // value = string (move id, e.g. "bounce")
    | "hp-cost" // value = number (% of maxHp as cost)
    | "self-faint" // value = null
    | "multi-hit" // value = [min, max] or number (fixed hits)
    | "unique"; // value = string (unique move id, handled separately)
  target: MoveTarget;
  chance: number; // 0-100
  value: any;
};

export type MovePrerequisite = {
  type:
    | "held-item"
    | "hp-above"
    | "hp-below"
    | "status"
    | "weather"
    | "move-history";
  value: any;
};

export type BattleMove = {
  name: string;
  id: string; // Machine name / kebab-case (e.g., "rain-dance")
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  maxPp: number;
  damageClass: "physical" | "special" | "status";
  priority: number;
  category: MoveCategory;
  effects: MoveEffect[];
  prerequisites?: MovePrerequisite[];
  description: string | null;
};
