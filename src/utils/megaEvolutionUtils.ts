import { MEGA_STATS } from "../data/pokemon/stats/megaStats";
import { Pokemon } from "../types/pokemon";
import { calculateHp, calculateStat } from "../utils/statCalculator";

/**
 * Reverts a Mega Evolved Pokémon to its base form.
 */
export function revertMegaEvolution(basePokemon: Pokemon): Pokemon {
  return { ...basePokemon };
}

/**
 * Handles the logic for Mega Evolution.
 */
export async function applyMegaEvolution(pokemon: Pokemon): Promise<Pokemon> {
  // ...
  const heldItem = pokemon.heldItem;
  if (!heldItem || !MEGA_STATS[heldItem]) {
    return pokemon;
  }

  const megaData = MEGA_STATS[heldItem];

  // Calculate new stats while maintaining current HP percentage
  const hpPercent = pokemon.hp / pokemon.maxHp;
  const newMaxHp = calculateHp(megaData.baseStats.hp, pokemon.level);

  // Derived Sprites (Handle Shiny and Direction)
  let backImage = megaData.spriteUrl;
  let frontImage = megaData.spriteUrl;

  // Pattern detection and replacement
  if (backImage.includes("xyani-back")) {
    frontImage = backImage.replace("xyani-back", "xyani");
    if (pokemon.isShiny) {
      backImage = backImage.replace("xyani-back", "xyani-back-shiny");
      frontImage = frontImage.replace("xyani", "xyani-shiny");
    }
  } else if (backImage.includes("ani-back")) {
    frontImage = backImage.replace("ani-back", "ani");
    if (pokemon.isShiny) {
      backImage = backImage.replace("ani-back", "ani-back-shiny");
      frontImage = frontImage.replace("ani", "ani-shiny");
    }
  } else if (backImage.includes("-back")) {
    frontImage = backImage.replace("-back", "");
    if (pokemon.isShiny) {
      backImage = backImage.replace("-back", "-back-shiny");
      frontImage = frontImage.replace("/sprites/", "/sprites/shiny/"); // Fallback for simple folders
    }
  }

  return {
    ...pokemon,
    name: `Mega ${pokemon.name}`,
    type: megaData.types,
    ability: megaData.ability,
    frontImage: frontImage,
    backImage: backImage,
    hp: Math.floor(newMaxHp * hpPercent),
    maxHp: newMaxHp,
    attack: calculateStat(megaData.baseStats.attack, pokemon.level),
    defense: calculateStat(megaData.baseStats.defense, pokemon.level),
    specialAttack: calculateStat(megaData.baseStats.spAttack, pokemon.level),
    specialDefense: calculateStat(megaData.baseStats.spDefense, pokemon.level),
    speed: calculateStat(megaData.baseStats.speed, pokemon.level),
  };
}
