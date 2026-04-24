export type GrowthRate =
  | "fast"
  | "medium-fast"
  | "medium-slow"
  | "slow"
  | "erratic"
  | "fluctuating";

export const growthRates: Record<GrowthRate, (level: number) => number> = {
  fast: (level) => Math.floor((4 * Math.pow(level, 3)) / 5),

  "medium-fast": (level) => Math.pow(level, 3),

  "medium-slow": (level) =>
    Math.floor(
      (6 / 5) * Math.pow(level, 3) -
        15 * Math.pow(level, 2) +
        100 * level -
        140,
    ),

  slow: (level) => Math.floor((5 * Math.pow(level, 3)) / 4),

  erratic: (level) => {
    if (level <= 50)
      return Math.floor((Math.pow(level, 3) * (100 - level)) / 50);

    if (level <= 68)
      return Math.floor((Math.pow(level, 3) * (150 - level)) / 100);

    if (level <= 98)
      return Math.floor((Math.pow(level, 3) * ((1911 - 10 * level) / 3)) / 500);

    return Math.floor((Math.pow(level, 3) * (160 - level)) / 100);
  },

  fluctuating: (level) => {
    if (level <= 15)
      return Math.floor((Math.pow(level, 3) * ((level + 1) / 3 + 24)) / 50);

    if (level <= 36)
      return Math.floor((Math.pow(level, 3) * (level + 14)) / 50);

    return Math.floor((Math.pow(level, 3) * (level / 2 + 32)) / 50);
  },
};
