import type { EncounterTable } from "@/src/encounter/types";

// ────────────────────────────────────────────────────────────────────────────
// PLAINS: Blooming Meadows
// Normal, Grass, Fairy, Bug, Poison
// Total = 1.0
// ────────────────────────────────────────────────────────────────────────────
export const gen2Plains: EncounterTable = [
  { id: 161, rate: 0.13, levels: { min: 3, max: 8 } }, // Sentret
  { id: 163, rate: 0.13, levels: { min: 3, max: 8 } }, // Hoothoot
  { id: 165, rate: 0.11, levels: { min: 3, max: 8 } }, // Ledyba
  { id: 167, rate: 0.11, levels: { min: 3, max: 8 } }, // Spinarak
  { id: 187, rate: 0.11, levels: { min: 5, max: 10 } }, // Hoppip
  { id: 191, rate: 0.09, levels: { min: 5, max: 10 } }, // Sunkern

  { id: 179, rate: 0.08, levels: { min: 8, max: 14 } }, // Mareep
  { id: 209, rate: 0.08, levels: { min: 10, max: 16 } }, // Snubbull

  { id: 190, rate: 0.06, levels: { min: 8, max: 14 } }, // Aipom
  { id: 193, rate: 0.05, levels: { min: 8, max: 14 } }, // Yanma
  { id: 198, rate: 0.05, levels: { min: 10, max: 18 } }, // Murkrow

  { id: 235, rate: 0.035, levels: { min: 12, max: 18 } }, // Smeargle
  { id: 241, rate: 0.025, levels: { min: 15, max: 22 } }, // Miltank

  { id: 242, rate: 0.005, levels: { min: 30, max: 40 } }, // Blissey
  { id: 251, rate: 0.001, levels: { min: 30, max: 30 } }, // Celebi ✨
];

// ────────────────────────────────────────────────────────────────────────────
// MOUNTAIN: Peak of Titans
// Rock, Ground, Flying, Fighting
// Total = 1.0
// ────────────────────────────────────────────────────────────────────────────
export const gen2Mountain: EncounterTable = [
  { id: 231, rate: 0.19, levels: { min: 10, max: 20 } }, // Phanpy
  { id: 216, rate: 0.18, levels: { min: 12, max: 18 } }, // Teddiursa
  { id: 207, rate: 0.16, levels: { min: 15, max: 22 } }, // Gligar
  { id: 185, rate: 0.13, levels: { min: 12, max: 22 } }, // Sudowoodo
  { id: 234, rate: 0.13, levels: { min: 15, max: 25 } }, // Stantler

  { id: 227, rate: 0.1, levels: { min: 20, max: 28 } }, // Skarmory
  { id: 246, rate: 0.08, levels: { min: 15, max: 25 } }, // Larvitar

  { id: 247, rate: 0.025, levels: { min: 30, max: 45 } }, // Pupitar
  { id: 248, rate: 0.004, levels: { min: 55, max: 65 } }, // Tyranitar

  { id: 243, rate: 0.001, levels: { min: 50, max: 50 } }, // Raikou ✨
];

// ────────────────────────────────────────────────────────────────────────────
// WATER: Azure Coast & Open Sea
// Water, Ice
// Total = 1.0
// ────────────────────────────────────────────────────────────────────────────
export const gen2Water: EncounterTable = [
  { id: 183, rate: 0.16, levels: { min: 5, max: 12 } }, // Marill
  { id: 194, rate: 0.16, levels: { min: 5, max: 12 } }, // Wooper
  { id: 170, rate: 0.15, levels: { min: 10, max: 20 } }, // Chinchou

  { id: 222, rate: 0.12, levels: { min: 12, max: 22 } }, // Corsola
  { id: 223, rate: 0.1, levels: { min: 15, max: 25 } }, // Remoraid

  { id: 211, rate: 0.08, levels: { min: 12, max: 20 } }, // Qwilfish
  { id: 220, rate: 0.08, levels: { min: 15, max: 25 } }, // Swinub

  { id: 226, rate: 0.075, levels: { min: 20, max: 30 } }, // Mantine
  { id: 225, rate: 0.045, levels: { min: 18, max: 28 } }, // Delibird

  { id: 230, rate: 0.02, levels: { min: 30, max: 40 } }, // Kingdra
  { id: 158, rate: 0.02, levels: { min: 5, max: 15 } }, // Totodile

  { id: 245, rate: 0.001, levels: { min: 40, max: 40 } }, // Suicune ✨
  { id: 249, rate: 0.0005, levels: { min: 60, max: 60 } }, // Lugia ✨
];

// ────────────────────────────────────────────────────────────────────────────
// CAVE: Deep Caverns
// Rock, Ground, Steel, Ghost
// Total = 1.0 (already correct)
// ────────────────────────────────────────────────────────────────────────────
export const gen2Cave: EncounterTable = [
  { id: 201, rate: 0.3, levels: { min: 5, max: 20 } }, // Unown
  { id: 206, rate: 0.2, levels: { min: 10, max: 20 } }, // Dunsparce
  { id: 213, rate: 0.15, levels: { min: 12, max: 22 } }, // Shuckle
  { id: 208, rate: 0.1, levels: { min: 25, max: 35 } }, // Steelix
  { id: 200, rate: 0.1, levels: { min: 15, max: 25 } }, // Misdreavus
  { id: 218, rate: 0.08, levels: { min: 14, max: 22 } }, // Slugma
  { id: 219, rate: 0.05, levels: { min: 30, max: 40 } }, // Magcargo
  { id: 246, rate: 0.02, levels: { min: 20, max: 30 } }, // Larvitar
];

// ────────────────────────────────────────────────────────────────────────────
// URBAN: Abandoned Laboratory
// Electric, Steel, Psychic
// Total = 1.0
// ────────────────────────────────────────────────────────────────────────────
export const gen2Urban: EncounterTable = [
  { id: 203, rate: 0.21, levels: { min: 15, max: 25 } }, // Girafarig
  { id: 202, rate: 0.16, levels: { min: 15, max: 25 } }, // Wobbuffet
  { id: 177, rate: 0.16, levels: { min: 12, max: 20 } }, // Natu

  { id: 233, rate: 0.13, levels: { min: 20, max: 30 } }, // Porygon2
  { id: 239, rate: 0.13, levels: { min: 10, max: 20 } }, // Elekid
  { id: 238, rate: 0.13, levels: { min: 10, max: 20 } }, // Smoochum
  { id: 240, rate: 0.13, levels: { min: 10, max: 20 } }, // Magby

  { id: 212, rate: 0.02, levels: { min: 25, max: 35 } }, // Scizor
];

// ────────────────────────────────────────────────────────────────────────────
// VOLCANO: Magma Crater
// Fire, Dark, Fighting
// Total = 1.0
// ────────────────────────────────────────────────────────────────────────────
export const gen2Volcano: EncounterTable = [
  { id: 218, rate: 0.35, levels: { min: 15, max: 25 } }, // Slugma
  { id: 228, rate: 0.32, levels: { min: 15, max: 25 } }, // Houndour
  { id: 240, rate: 0.22, levels: { min: 12, max: 22 } }, // Magby

  { id: 214, rate: 0.05, levels: { min: 18, max: 28 } }, // Heracross

  { id: 155, rate: 0.03, levels: { min: 5, max: 15 } }, // Cyndaquil

  { id: 244, rate: 0.009, levels: { min: 40, max: 50 } }, // Entei ✨
  { id: 250, rate: 0.001, levels: { min: 60, max: 60 } }, // Ho-Oh ✨
];

// ────────────────────────────────────────────────────────────────────────────
// TRAINING: Training Grounds
// Starters, Babies, Rares
// Total = 1.0
// ────────────────────────────────────────────────────────────────────────────
export const gen2Training: EncounterTable = [
  { id: 152, rate: 0.12, levels: { min: 5, max: 15 } }, // Chikorita
  { id: 155, rate: 0.12, levels: { min: 5, max: 15 } }, // Cyndaquil
  { id: 158, rate: 0.12, levels: { min: 5, max: 15 } }, // Totodile

  { id: 172, rate: 0.12, levels: { min: 3, max: 10 } }, // Pichu
  { id: 175, rate: 0.12, levels: { min: 5, max: 12 } }, // Togepi
  { id: 236, rate: 0.12, levels: { min: 10, max: 20 } }, // Tyrogue

  { id: 232, rate: 0.18, levels: { min: 20, max: 30 } }, // Donphan

  { id: 212, rate: 0.07, levels: { min: 25, max: 35 } }, // Scizor
  { id: 237, rate: 0.05, levels: { min: 25, max: 35 } }, // Hitmontop
];

// ────────────────────────────────────────────────────────────────────────────
// SAFARI: Safari Zone (Gen 2)
// Rare-focused area
// Total = 1.0
// ────────────────────────────────────────────────────────────────────────────
export const gen2Safari: EncounterTable = [
  { id: 203, rate: 0.14, levels: { min: 15, max: 25 } }, // Girafarig
  { id: 234, rate: 0.14, levels: { min: 15, max: 25 } }, // Stantler
  { id: 241, rate: 0.12, levels: { min: 15, max: 25 } }, // Miltank

  { id: 209, rate: 0.12, levels: { min: 12, max: 22 } }, // Snubbull
  { id: 216, rate: 0.12, levels: { min: 10, max: 20 } }, // Teddiursa

  { id: 173, rate: 0.1, levels: { min: 3, max: 10 } }, // Cleffa
  { id: 174, rate: 0.1, levels: { min: 3, max: 10 } }, // Igglybuff

  { id: 215, rate: 0.08, levels: { min: 15, max: 25 } }, // Sneasel

  { id: 214, rate: 0.04, levels: { min: 15, max: 25 } }, // Heracross
];
