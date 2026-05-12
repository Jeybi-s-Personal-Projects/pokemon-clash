import { fetchPokemon } from "../api/pokeApi";
import { fetchMoveBatch } from "../encounter/fetchWithCache";
import { Pokemon } from "../types/pokemon";
import { parseRawMoves, selectMoves } from "../utils/moveSelector";
import { calculateHp, calculateStat } from "../utils/statCalculator";
import { getExpForLevel, getGrowthRate } from "../utils/experienceCalculator";
import { SPECIES } from "../data/pokemon/species/species";

export async function getPokemon(
  name: string,
  level: number,
): Promise<Pokemon> {
  const data = await fetchPokemon(name);
  const speciesId = data.id;

  // 1. Parse PokeAPI moves into our RawMove shape
  const allParsedMoves = parseRawMoves(data.moves);

  // 2. Get Move Selection (logic for most recent level-up moves)
  const selectedMoveData = selectMoves(allParsedMoves, level);

  // 3. Fetch Move Details in parallel with caching
  const moveDetails = await fetchMoveBatch(selectedMoveData);

  // 4. Map to final Move format
  const moves = moveDetails.map((detail) => ({
    name: detail.name,
    power: detail.power ?? 0,
    pp: detail.pp ?? 0,
    maxPp: detail.pp ?? 0,
    damageClass: detail.damageClass,
    type: detail.type,
    accuracy: detail.accuracy,
    statChanges: detail.statChanges,
    description: detail.description,
    priority: detail.priority,
  }));

  const getBaseStat = (statName: string) =>
    data.stats.find((s: any) => s.stat.name === statName).base_stat;

  const baseHp = getBaseStat("hp");
  const hp = calculateHp(baseHp, level);

  const growthRate = getGrowthRate(speciesId);
  const experience = getExpForLevel(level, growthRate);

  // Get ability from local species data
  const speciesData = SPECIES[speciesId];
  const ability = speciesData?.abilities[0] ?? "none";

  return {
    speciesId,
    name: data.name,
    level,
    experience,
    growthRate,
    type: data.types.map((t: any) => t.type.name),
    hp,
    maxHp: hp,
    attack: calculateStat(getBaseStat("attack"), level),
    defense: calculateStat(getBaseStat("defense"), level),
    specialAttack: calculateStat(getBaseStat("special-attack"), level),
    specialDefense: calculateStat(getBaseStat("special-defense"), level),
    speed: calculateStat(getBaseStat("speed"), level),
    frontImage: data.sprites.other.showdown.front_default,
    backImage: data.sprites.other.showdown.back_default,
    moves,
    ability,
    cry: `https://play.pokemonshowdown.com/audio/cries/${data.name}.mp3`,
  };
}
