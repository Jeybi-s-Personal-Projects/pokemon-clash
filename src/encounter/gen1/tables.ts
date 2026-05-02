import type { EncounterTable } from "@/src/encounter/types";

// ────────────────────────────────────────────────────────────────────────────
// PLAINS: Blooming Meadows & Routes
// Normal, Grass, Fairy, Bug, Poison
// ────────────────────────────────────────────────────────────────────────────
export const gen1Plains: EncounterTable = [
  { id: 16, rate: 0.1, levels: { min: 3, max: 8 } }, // Pidgey
  { id: 19, rate: 0.1, levels: { min: 2, max: 6 } }, // Rattata
  { id: 10, rate: 0.08, levels: { min: 3, max: 7 } }, // Caterpie
  { id: 13, rate: 0.08, levels: { min: 3, max: 7 } }, // Weedle
  { id: 21, rate: 0.07, levels: { min: 4, max: 10 } }, // Spearow
  { id: 23, rate: 0.06, levels: { min: 6, max: 12 } }, // Ekans
  { id: 25, rate: 0.05, levels: { min: 5, max: 12 } }, // Pikachu
  { id: 27, rate: 0.06, levels: { min: 8, max: 15 } }, // Sandshrew
  { id: 29, rate: 0.05, levels: { min: 10, max: 18 } }, // Nidoran♀
  { id: 32, rate: 0.05, levels: { min: 10, max: 18 } }, // Nidoran♂
  { id: 35, rate: 0.04, levels: { min: 8, max: 14 } }, // Clefairy
  { id: 39, rate: 0.04, levels: { min: 5, max: 12 } }, // Jigglypuff
  { id: 43, rate: 0.05, levels: { min: 6, max: 14 } }, // Oddish
  { id: 69, rate: 0.05, levels: { min: 6, max: 14 } }, // Bellsprout
  { id: 52, rate: 0.04, levels: { min: 10, max: 18 } }, // Meowth
  { id: 132, rate: 0.02, levels: { min: 20, max: 30 } }, // Ditto
  { id: 133, rate: 0.01, levels: { min: 15, max: 25 } }, // Eevee
  { id: 83, rate: 0.01, levels: { min: 15, max: 25 } }, // Farfetch'd
  { id: 128, rate: 0.04, levels: { min: 20, max: 30 } }, // Tauros
];

// ────────────────────────────────────────────────────────────────────────────
// MOUNTAIN: Peak of Titans
// Rock, Ground, Flying, Fighting
// ────────────────────────────────────────────────────────────────────────────
export const gen1Mountain: EncounterTable = [
  { id: 74, rate: 0.15, levels: { min: 12, max: 20 } }, // Geodude
  { id: 66, rate: 0.12, levels: { min: 14, max: 22 } }, // Machop
  { id: 95, rate: 0.08, levels: { min: 18, max: 28 } }, // Onix
  { id: 104, rate: 0.1, levels: { min: 15, max: 25 } }, // Cubone
  { id: 111, rate: 0.08, levels: { min: 20, max: 30 } }, // Rhyhorn
  { id: 56, rate: 0.1, levels: { min: 12, max: 20 } }, // Mankey
  { id: 21, rate: 0.12, levels: { min: 10, max: 18 } }, // Spearow
  { id: 22, rate: 0.05, levels: { min: 22, max: 32 } }, // Fearow
  { id: 84, rate: 0.08, levels: { min: 15, max: 25 } }, // Doduo
  { id: 85, rate: 0.03, levels: { min: 30, max: 40 } }, // Dodrio
  { id: 142, rate: 0.01, levels: { min: 40, max: 50 } }, // Aerodactyl
  { id: 145, rate: 0.002, levels: { min: 50, max: 50 } }, // Zapdos ✨
];

// ────────────────────────────────────────────────────────────────────────────
// WATER: Azure Coast & Open Sea
// Water, Ice
// ────────────────────────────────────────────────────────────────────────────
export const gen1Water: EncounterTable = [
  { id: 7, rate: 0.02, levels: { min: 5, max: 15 } }, // Squirtle
  { id: 129, rate: 0.2, levels: { min: 3, max: 15 } }, // Magikarp
  { id: 60, rate: 0.1, levels: { min: 5, max: 15 } }, // Poliwag
  { id: 72, rate: 0.15, levels: { min: 15, max: 25 } }, // Tentacool
  { id: 98, rate: 0.1, levels: { min: 10, max: 20 } }, // Krabby
  { id: 116, rate: 0.08, levels: { min: 12, max: 22 } }, // Horsea
  { id: 118, rate: 0.08, levels: { min: 10, max: 20 } }, // Goldeen
  { id: 54, rate: 0.06, levels: { min: 12, max: 22 } }, // Psyduck
  { id: 79, rate: 0.05, levels: { min: 12, max: 22 } }, // Slowpoke
  { id: 86, rate: 0.04, levels: { min: 20, max: 30 } }, // Seel
  { id: 90, rate: 0.04, levels: { min: 15, max: 25 } }, // Shellder
  { id: 120, rate: 0.04, levels: { min: 15, max: 25 } }, // Staryu
  { id: 130, rate: 0.01, levels: { min: 30, max: 45 } }, // Gyarados
  { id: 131, rate: 0.01, levels: { min: 30, max: 40 } }, // Lapras
  { id: 144, rate: 0.002, levels: { min: 50, max: 50 } }, // Articuno ✨
];

// ────────────────────────────────────────────────────────────────────────────
// CAVE: Deep Caverns
// Rock, Ground, Steel, Ghost, Fossil
// ────────────────────────────────────────────────────────────────────────────
export const gen1Cave: EncounterTable = [
  { id: 41, rate: 0.2, levels: { min: 5, max: 15 } }, // Zubat
  { id: 74, rate: 0.15, levels: { min: 8, max: 18 } }, // Geodude
  { id: 46, rate: 0.1, levels: { min: 10, max: 20 } }, // Paras
  { id: 50, rate: 0.12, levels: { min: 15, max: 25 } }, // Diglett
  { id: 95, rate: 0.08, levels: { min: 20, max: 35 } }, // Onix
  { id: 66, rate: 0.08, levels: { min: 15, max: 25 } }, // Machop
  { id: 92, rate: 0.08, levels: { min: 15, max: 25 } }, // Gastly
  { id: 138, rate: 0.04, levels: { min: 20, max: 30 } }, // Omanyte
  { id: 140, rate: 0.04, levels: { min: 20, max: 30 } }, // Kabuto
  { id: 142, rate: 0.02, levels: { min: 35, max: 45 } }, // Aerodactyl
  { id: 111, rate: 0.04, levels: { min: 20, max: 30 } }, // Rhyhorn
  { id: 151, rate: 0.002, levels: { min: 30, max: 30 } }, // Mew ✨
];

// ────────────────────────────────────────────────────────────────────────────
// URBAN: Abandoned Laboratory
// Electric, Steel, Poison, Psychic, Ghost
// ────────────────────────────────────────────────────────────────────────────
export const gen1Urban: EncounterTable = [
  { id: 81, rate: 0.15, levels: { min: 10, max: 20 } }, // Magnemite
  { id: 100, rate: 0.15, levels: { min: 10, max: 20 } }, // Voltorb
  { id: 88, rate: 0.12, levels: { min: 15, max: 25 } }, // Grimer
  { id: 109, rate: 0.12, levels: { min: 15, max: 25 } }, // Koffing
  { id: 96, rate: 0.1, levels: { min: 12, max: 22 } }, // Drowzee
  { id: 63, rate: 0.08, levels: { min: 10, max: 20 } }, // Abra
  { id: 92, rate: 0.08, levels: { min: 15, max: 25 } }, // Gastly
  { id: 122, rate: 0.05, levels: { min: 20, max: 30 } }, // Mr. Mime
  { id: 137, rate: 0.05, levels: { min: 15, max: 25 } }, // Porygon
  { id: 124, rate: 0.04, levels: { min: 25, max: 35 } }, // Jynx
  { id: 125, rate: 0.04, levels: { min: 25, max: 35 } }, // Electabuzz
  { id: 150, rate: 0.002, levels: { min: 70, max: 70 } }, // Mewtwo ✨
];

// ────────────────────────────────────────────────────────────────────────────
// VOLCANO: Magma Crater
// Fire, Fighting
// ────────────────────────────────────────────────────────────────────────────
export const gen1Volcano: EncounterTable = [
  { id: 4, rate: 0.02, levels: { min: 5, max: 15 } }, // Charmander
  { id: 37, rate: 0.2, levels: { min: 14, max: 22 } }, // Vulpix
  { id: 58, rate: 0.2, levels: { min: 14, max: 22 } }, // Growlithe
  { id: 77, rate: 0.15, levels: { min: 15, max: 25 } }, // Ponyta
  { id: 126, rate: 0.1, levels: { min: 25, max: 35 } }, // Magmar
  { id: 56, rate: 0.12, levels: { min: 12, max: 20 } }, // Mankey
  { id: 66, rate: 0.1, levels: { min: 15, max: 25 } }, // Machop
  { id: 136, rate: 0.04, levels: { min: 25, max: 35 } }, // Flareon
  { id: 146, rate: 0.002, levels: { min: 50, max: 50 } }, // Moltres ✨
];

// ────────────────────────────────────────────────────────────────────────────
// TRAINING: Training Grounds
// Starters, Rares, Dragons
// ────────────────────────────────────────────────────────────────────────────
export const gen1Training: EncounterTable = [
  { id: 1, rate: 0.05, levels: { min: 5, max: 15 } }, // Bulbasaur
  { id: 4, rate: 0.05, levels: { min: 5, max: 15 } }, // Charmander
  { id: 7, rate: 0.05, levels: { min: 5, max: 15 } }, // Squirtle
  { id: 25, rate: 0.15, levels: { min: 5, max: 15 } }, // Pikachu
  { id: 133, rate: 0.12, levels: { min: 10, max: 20 } }, // Eevee
  { id: 106, rate: 0.08, levels: { min: 25, max: 35 } }, // Hitmonlee
  { id: 107, rate: 0.08, levels: { min: 25, max: 35 } }, // Hitmonchan
  { id: 113, rate: 0.08, levels: { min: 20, max: 30 } }, // Chansey
  { id: 143, rate: 0.08, levels: { min: 30, max: 45 } }, // Snorlax
  { id: 147, rate: 0.1, levels: { min: 15, max: 25 } }, // Dratini
  { id: 148, rate: 0.05, levels: { min: 30, max: 45 } }, // Dragonair
  { id: 149, rate: 0.02, levels: { min: 50, max: 65 } }, // Dragonite
];

// ────────────────────────────────────────────────────────────────────────────
// SAFARI: Safari Zone
// Rare, Versatile, High-HP
// ────────────────────────────────────────────────────────────────────────────
export const gen1Safari: EncounterTable = [
  { id: 115, rate: 0.12, levels: { min: 15, max: 30 } }, // Kangaskhan
  { id: 128, rate: 0.12, levels: { min: 15, max: 30 } }, // Tauros
  { id: 123, rate: 0.1, levels: { min: 20, max: 35 } }, // Scyther
  { id: 127, rate: 0.1, levels: { min: 20, max: 35 } }, // Pinsir
  { id: 108, rate: 0.1, levels: { min: 15, max: 25 } }, // Lickitung
  { id: 113, rate: 0.1, levels: { min: 15, max: 25 } }, // Chansey
  { id: 114, rate: 0.1, levels: { min: 15, max: 25 } }, // Tangela
  { id: 48, rate: 0.1, levels: { min: 12, max: 22 } }, // Venonat
  { id: 102, rate: 0.1, levels: { min: 15, max: 25 } }, // Exeggcute
  { id: 46, rate: 0.06, levels: { min: 10, max: 20 } }, // Paras
];
