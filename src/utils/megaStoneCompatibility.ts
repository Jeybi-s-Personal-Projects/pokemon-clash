/**
 * megaStoneCompatibility.ts
 * Defines which Mega Stone is compatible with which Pokémon species.
 */
export const MEGA_STONE_COMPATIBILITY: Record<string, number[]> = {
  "charizardite-x": [6],
  "charizardite-y": [6],
  venusaurite: [3],
  blastoisinite: [9],
  beedrillite: [15],
  pidgeotite: [18],
  alakazite: [65],
  slowbronite: [80],
  gengarite: [94],
  kangaskhanite: [115],
  pinsirite: [127],
  gyaradosite: [130],
  aerodactylite: [142],
  mewtwonite_x: [150],
  mewtwonite_y: [150],
  clefablite: [36],
  starmite: [121],
  dragonitite: [149],
  ampharosite: [181],
  scizorite: [212],
  heracronite: [214],
  houndoominite: [229],
  tyranitarite: [248],
  steelixite: [208],
  meganiumite: [154],
  feraligatrite: [160],
  skarmorite: [227],
};

export const isMegaStoneCompatible = (
  itemName: string,
  speciesId: number,
): boolean => {
  const compatibleSpecies = MEGA_STONE_COMPATIBILITY[itemName];
  return !!compatibleSpecies && compatibleSpecies.includes(speciesId);
};
