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
  // ==================
  // GEN 1 — RETURNING
  // ==================

  // Mega Venusaur
  venusaurite: {
    baseStats: {
      hp: 80,
      attack: 100,
      defense: 123,
      spAttack: 122,
      spDefense: 120,
      speed: 80,
    },
    types: ["grass", "poison"],
    ability: "thick-fat",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/venusaur-mega.gif",
  },

  // Mega Blastoise
  blastoisinite: {
    baseStats: {
      hp: 79,
      attack: 103,
      defense: 120,
      spAttack: 135,
      spDefense: 115,
      speed: 78,
    },
    types: ["water"],
    ability: "mega-launcher",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/blastoise-mega.gif",
  },

  // Mega Beedrill
  beedrillite: {
    baseStats: {
      hp: 65,
      attack: 150,
      defense: 40,
      spAttack: 15,
      spDefense: 80,
      speed: 145,
    },
    types: ["bug", "poison"],
    ability: "adaptability",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/beedrill-mega.gif",
  },

  // Mega Pidgeot
  pidgeotite: {
    baseStats: {
      hp: 83,
      attack: 80,
      defense: 80,
      spAttack: 135,
      spDefense: 80,
      speed: 121,
    },
    types: ["normal", "flying"],
    ability: "no-guard",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/pidgeot-mega.gif",
  },

  // Mega Alakazam
  alakazite: {
    baseStats: {
      hp: 55,
      attack: 50,
      defense: 65,
      spAttack: 175,
      spDefense: 95,
      speed: 150,
    },
    types: ["psychic"],
    ability: "trace",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/alakazam-mega.gif",
  },

  // Mega Slowbro
  slowbronite: {
    baseStats: {
      hp: 95,
      attack: 75,
      defense: 180,
      spAttack: 130,
      spDefense: 80,
      speed: 30,
    },
    types: ["water", "psychic"],
    ability: "shell-armor",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/slowbro-mega.gif",
  },

  // Mega Gengar
  gengarite: {
    baseStats: {
      hp: 60,
      attack: 65,
      defense: 80,
      spAttack: 170,
      spDefense: 95,
      speed: 130,
    },
    types: ["ghost", "poison"],
    ability: "shadow-tag",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/gengar-mega.gif",
  },

  // Mega Kangaskhan
  kangaskhanite: {
    baseStats: {
      hp: 105,
      attack: 125,
      defense: 100,
      spAttack: 60,
      spDefense: 100,
      speed: 100,
    },
    types: ["normal"],
    ability: "parental-bond",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/kangaskhan-mega.gif",
  },

  // Mega Pinsir
  pinsirite: {
    baseStats: {
      hp: 65,
      attack: 155,
      defense: 120,
      spAttack: 65,
      spDefense: 90,
      speed: 105,
    },
    types: ["bug", "flying"],
    ability: "aerilate",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/pinsir-mega.gif",
  },

  // Mega Gyarados
  gyaradosite: {
    baseStats: {
      hp: 95,
      attack: 155,
      defense: 109,
      spAttack: 70,
      spDefense: 130,
      speed: 81,
    },
    types: ["water", "dark"],
    ability: "mold-breaker",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/gyarados-mega.gif",
  },

  // Mega Aerodactyl
  aerodactylite: {
    baseStats: {
      hp: 80,
      attack: 135,
      defense: 85,
      spAttack: 70,
      spDefense: 95,
      speed: 150,
    },
    types: ["rock", "flying"],
    ability: "tough-claws",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/aerodactyl-mega.gif",
  },

  // Mega Mewtwo X
  mewtwonite_x: {
    baseStats: {
      hp: 106,
      attack: 190,
      defense: 100,
      spAttack: 154,
      spDefense: 100,
      speed: 130,
    },
    types: ["psychic", "fighting"],
    ability: "steadfast",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/mewtwo-megax.gif",
  },

  // Mega Mewtwo Y
  mewtwonite_y: {
    baseStats: {
      hp: 106,
      attack: 150,
      defense: 70,
      spAttack: 194,
      spDefense: 120,
      speed: 140,
    },
    types: ["psychic"],
    ability: "insomnia",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/mewtwo-megay.gif",
  },

  // ========================
  // GEN 1 — NEW (Z-A)
  // ========================

  // Mega Clefable (NEW in Z-A)
  clefablite: {
    baseStats: {
      hp: 95,
      attack: 80,
      defense: 93,
      spAttack: 135,
      spDefense: 110,
      speed: 70,
    },
    types: ["fairy", "flying"],
    ability: "magic-guard",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/ani-back/clefable-mega.gif",
  },

  // Mega Starmie (NEW in Z-A)
  starmite: {
    baseStats: {
      hp: 60,
      attack: 75,
      defense: 85,
      spAttack: 165,
      spDefense: 85,
      speed: 145,
    },
    types: ["water", "psychic"],
    ability: "analytic",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/ani-back/starmie-mega.gif",
  },

  // Mega Dragonite (NEW in Z-A)
  dragonitite: {
    baseStats: {
      hp: 91,
      attack: 124,
      defense: 115,
      spAttack: 145,
      spDefense: 125,
      speed: 100,
    },
    types: ["dragon", "flying"],
    ability: "multiscale",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/ani-back/dragonite-mega.gif",
  },

  // ==================
  // GEN 2 — RETURNING
  // ==================

  // Mega Ampharos
  ampharosite: {
    baseStats: {
      hp: 90,
      attack: 95,
      defense: 105,
      spAttack: 165,
      spDefense: 110,
      speed: 45,
    },
    types: ["electric", "dragon"],
    ability: "mold-breaker",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/ampharos-mega.gif",
  },

  // Mega Scizor
  scizorite: {
    baseStats: {
      hp: 70,
      attack: 150,
      defense: 140,
      spAttack: 65,
      spDefense: 100,
      speed: 75,
    },
    types: ["bug", "steel"],
    ability: "technician",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/scizor-mega.gif",
  },

  // Mega Heracross
  heracronite: {
    baseStats: {
      hp: 80,
      attack: 185,
      defense: 115,
      spAttack: 40,
      spDefense: 105,
      speed: 75,
    },
    types: ["bug", "fighting"],
    ability: "skill-link",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/heracross-mega.gif",
  },

  // Mega Houndoom
  houndoominite: {
    baseStats: {
      hp: 75,
      attack: 90,
      defense: 90,
      spAttack: 140,
      spDefense: 90,
      speed: 115,
    },
    types: ["dark", "fire"],
    ability: "solar-power",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/houndoom-mega.gif",
  },

  // Mega Tyranitar
  tyranitarite: {
    baseStats: {
      hp: 100,
      attack: 164,
      defense: 150,
      spAttack: 95,
      spDefense: 120,
      speed: 71,
    },
    types: ["rock", "dark"],
    ability: "sand-stream",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/tyranitar-mega.gif",
  },

  // Mega Steelix
  steelixite: {
    baseStats: {
      hp: 75,
      attack: 125,
      defense: 230,
      spAttack: 55,
      spDefense: 95,
      speed: 30,
    },
    types: ["steel", "ground"],
    ability: "sand-force",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/xyani-back/steelix-mega.gif",
  },

  // ========================
  // GEN 2 — NEW (Z-A)
  // ========================

  // Mega Meganium (NEW in Z-A)
  meganiumite: {
    baseStats: {
      hp: 80,
      attack: 92,
      defense: 115,
      spAttack: 143,
      spDefense: 115,
      speed: 80,
    },
    types: ["grass", "fairy"],
    ability: "flower-veil",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/ani-back/meganium-mega.gif",
  },

  // Mega Feraligatr (NEW in Z-A)
  feraligatrite: {
    baseStats: {
      hp: 85,
      attack: 160,
      defense: 125,
      spAttack: 89,
      spDefense: 93,
      speed: 78,
    },
    types: ["water", "dragon"],
    ability: "strong-jaw",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/ani-back/feraligatr-mega.gif",
  },

  // Mega Skarmory (NEW in Z-A)
  skarmorite: {
    baseStats: {
      hp: 65,
      attack: 120,
      defense: 160,
      spAttack: 50,
      spDefense: 90,
      speed: 115,
    },
    types: ["steel", "flying"],
    ability: "sturdy",
    spriteUrl:
      "https://play.pokemonshowdown.com/sprites/ani-back/skarmory-mega.gif",
  },
};
