import type { EncounterTable } from "../types";

export const gen2Cave: EncounterTable = [
  { id: 231, rate: 0.3, levels: { min: 5, max: 10 } }, // Phanpy
  { id: 201, rate: 0.2, levels: { min: 8, max: 14 } }, // Unown
  { id: 204, rate: 0.2, levels: { min: 6, max: 12 } }, // Pineco
  { id: 185, rate: 0.15, levels: { min: 10, max: 16 } }, // Sudowoodo
  { id: 246, rate: 0.1, levels: { min: 12, max: 18 } }, // Larvitar
  { id: 247, rate: 0.04, levels: { min: 20, max: 28 } }, // Pupitar
  { id: 248, rate: 0.01, levels: { min: 30, max: 40 } }, // Tyranitar (rare)
];

export const gen2Grass: EncounterTable = [
  { id: 161, rate: 0.3, levels: { min: 3, max: 8 } }, // Sentret
  { id: 165, rate: 0.25, levels: { min: 3, max: 8 } }, // Ledyba
  { id: 187, rate: 0.2, levels: { min: 5, max: 10 } }, // Hoppip
  { id: 191, rate: 0.15, levels: { min: 5, max: 10 } }, // Sunkern
  { id: 190, rate: 0.06, levels: { min: 8, max: 14 } }, // Aipom
  { id: 234, rate: 0.03, levels: { min: 10, max: 16 } }, // Stantler
  { id: 212, rate: 0.01, levels: { min: 20, max: 28 } }, // Scizor (rare)
];

export const gen2Water: EncounterTable = [
  { id: 158, rate: 0.3, levels: { min: 5, max: 10 } }, // Totodile
  { id: 183, rate: 0.25, levels: { min: 5, max: 10 } }, // Marill
  { id: 186, rate: 0.2, levels: { min: 8, max: 14 } }, // Politoed
  { id: 170, rate: 0.15, levels: { min: 5, max: 12 } }, // Chinchou
  { id: 223, rate: 0.07, levels: { min: 10, max: 16 } }, // Remoraid
  { id: 230, rate: 0.02, levels: { min: 20, max: 28 } }, // Kingdra
  { id: 245, rate: 0.01, levels: { min: 30, max: 40 } }, // Suicune (rare)
];

export const gen2Forest: EncounterTable = [
  { id: 165, rate: 0.25, levels: { min: 3, max: 8 } }, // Ledyba
  { id: 167, rate: 0.25, levels: { min: 3, max: 8 } }, // Spinarak
  { id: 187, rate: 0.2, levels: { min: 5, max: 10 } }, // Hoppip
  { id: 193, rate: 0.15, levels: { min: 8, max: 14 } }, // Yanma
  { id: 204, rate: 0.1, levels: { min: 6, max: 12 } }, // Pineco
  { id: 214, rate: 0.04, levels: { min: 15, max: 22 } }, // Heracross
  { id: 251, rate: 0.01, levels: { min: 30, max: 40 } }, // Celebi (rare)
];
