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
  spriteUrl: string; // The sprite for the Mega form
};

export const MEGA_STATS: Record<string, MegaStats> = {
  // Example for Charizard X
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
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/mega-charizard-x.gif",
  },
  // Example for Charizard Y
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
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/mega-charizard-y.gif",
  },
  // Add other Mega Stones as needed...
};
