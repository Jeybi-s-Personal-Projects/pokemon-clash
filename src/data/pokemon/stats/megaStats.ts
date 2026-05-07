export type MegaStats = {
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  types: string[];
  ability: string; // Signature Mega Ability
  spriteUrl: string;
};

export const MEGA_STATS: Record<string, MegaStats> = {
  // Mega Charizard X
  "charizardite-x": {
    baseStats: {
      hp: 78,
      attack: 130,
      defense: 111,
      spAttack: 130,
      spDefense: 85,
      speed: 100,
    },
    types: ["fire", "dragon"],
    ability: "tough-claws",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/charizard-megax.gif",
  },

  // Mega Charizard Y
  "charizardite-y": {
    baseStats: {
      hp: 78,
      attack: 104,
      defense: 78,
      spAttack: 159,
      spDefense: 115,
      speed: 100,
    },
    types: ["fire", "flying"],
    ability: "drought",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/charizard-megay.gif",
  },
};
