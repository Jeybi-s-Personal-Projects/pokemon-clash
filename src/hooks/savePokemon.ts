/**
 * savePokemon.ts
 *
 * Saves a caught Pokémon to local SQLite.
 *
 * SQLite — stores all battle-relevant data (stats, images, moves)
 *
 * Team cap logic:
 *   - If roster < 6 → save to SQLite with a pk_order (active)
 *   - If roster = 6 → save to SQLite with pk_order = null (boxed)
 *                      caller must handle the swap modal and call swapIntoTeam()
 *                      if the player wants this Pokémon on the team
 */
import * as Crypto from "expo-crypto";
import db from "../lib/db";
import { Pokemon } from "../types/pokemon";

// ─── Save ─────────────────────────────────────────────────────────────────────

/**
 * Saves a caught Pokémon to local SQLite.
 */
export async function savePokemon(
  pokemon: Pokemon,
  userId: string,
): Promise<{ data: any; teamFull: boolean }> {
  const pkId = Crypto.randomUUID();

  // ── Step 1: Insert into SQLite ──
  db.runSync(
    `INSERT INTO pokemon (
      id, user_id, pk_species_id, pk_name, pk_level, pk_experience, 
      pk_hp, pk_max_hp, pk_attack, pk_defense, pk_special_attack, 
      pk_special_defense, pk_speed, pk_types, pk_ability, 
      pk_front_image, pk_back_image, pk_is_shiny, pk_cry, pk_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pkId,
      userId,
      pokemon.speciesId,
      pokemon.name,
      pokemon.level,
      pokemon.experience,
      pokemon.maxHp, // Fully heal caught pokemon
      pokemon.maxHp,
      pokemon.attack,
      pokemon.defense,
      pokemon.specialAttack,
      pokemon.specialDefense,
      pokemon.speed,
      JSON.stringify(pokemon.type),
      pokemon.ability || null,
      pokemon.frontImage,
      pokemon.backImage,
      pokemon.isShiny ? 1 : 0,
      pokemon.cry,
      null, // Initially null
    ]
  );

  // ── Step 2: Insert moves into SQLite ──
  for (const move of pokemon.moves) {
    const moveId = Crypto.randomUUID();
    db.runSync(
      `INSERT INTO pokemon_moves (
        id, pokemon_id, move_name, move_power, move_pp, 
        move_type, move_damageClass, move_accuracy, 
        move_statChanges, move_description, move_priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        moveId,
        pkId,
        move.name,
        move.power ?? 0,
        move.pp ?? 0,
        move.type ?? "normal",
        move.damageClass ?? "status",
        move.accuracy ?? 100,
        JSON.stringify(move.statChanges || []),
        move.description ?? "",
        move.priority ?? 0,
      ]
    );
  }

  // ── Step 3: Check team size from SQLite ──
  const teamCountRow = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM pokemon 
     WHERE user_id = ? AND pk_order IS NOT NULL AND pk_order != 0`,
    [userId]
  );

  const teamCount = teamCountRow?.count ?? 0;
  const teamFull = teamCount >= 6;

  // ── Step 4: Update pk_order if not full ──
  if (!teamFull) {
    db.runSync(
      `UPDATE pokemon SET pk_order = ? WHERE id = ?`,
      [teamCount + 1, pkId]
    );
  }

  // Retrieve the saved pokemon to return
  const savedPk = db.getFirstSync(`SELECT * FROM pokemon WHERE id = ?`, [pkId]);

  return { data: savedPk, teamFull };
}

// ─── Swap ─────────────────────────────────────────────────────────────────────

/**
 * Swaps a boxed Pokémon into the team.
 */
export async function swapIntoTeam(
  newPokemonId: string,
  replacedId: string,
): Promise<void> {
  const benchedPk = db.getFirstSync<{ pk_order: number }>(
    `SELECT pk_order FROM pokemon WHERE id = ?`,
    [replacedId]
  );

  if (!benchedPk) throw new Error("Replaced pokemon not found");

  const targetOrder = benchedPk.pk_order ?? 1;

  db.runSync(
    `UPDATE pokemon SET pk_order = ? WHERE id = ?`,
    [targetOrder, newPokemonId]
  );

  db.runSync(
    `UPDATE pokemon SET pk_order = NULL WHERE id = ?`,
    [replacedId]
  );
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

/**
 * Robustly syncs the entire team's progress to SQLite,
 * including their current movesets.
 */
export async function syncAllProgress(
  finalTeam: Pokemon[],
  shouldHeal: boolean = false,
): Promise<void> {
  try {
    for (const p of finalTeam) {
      if (!p.id) continue;

      // 1. Update stats (Use REPLACE or UPDATE)
      db.runSync(
        `UPDATE pokemon SET 
          pk_species_id = ?, pk_name = ?, pk_types = ?, pk_ability = ?,
          pk_front_image = ?, pk_back_image = ?, pk_is_shiny = ?, pk_cry = ?,
          pk_level = ?, pk_experience = ?, pk_hp = ?, pk_max_hp = ?,
          pk_attack = ?, pk_defense = ?, pk_special_attack = ?,
          pk_special_defense = ?, pk_speed = ?
        WHERE id = ?`,
        [
          p.speciesId,
          p.name,
          JSON.stringify(p.type),
          p.ability || null,
          p.frontImage,
          p.backImage,
          p.isShiny ? 1 : 0,
          p.cry,
          p.level,
          p.experience,
          shouldHeal ? p.maxHp : p.hp,
          p.maxHp,
          p.attack,
          p.defense,
          p.specialAttack,
          p.specialDefense,
          p.speed,
          p.id,
        ]
      );

      // 2. Sync moves
      if (!p.moves || p.moves.length === 0) continue;

      // Delete existing moves
      db.runSync(`DELETE FROM pokemon_moves WHERE pokemon_id = ?`, [p.id]);

      // Insert current moves
      for (const m of p.moves) {
        const moveId = Crypto.randomUUID();
        db.runSync(
          `INSERT INTO pokemon_moves (
            id, pokemon_id, move_name, move_power, move_pp, 
            move_type, move_damageClass, move_accuracy, 
            move_statChanges, move_description, move_priority
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            moveId,
            p.id,
            m.name,
            m.power ?? 0,
            shouldHeal ? (m.maxPp ?? m.pp) : m.pp,
            m.type ?? "normal",
            m.damageClass ?? "status",
            m.accuracy ?? 100,
            JSON.stringify(m.statChanges || []),
            m.description ?? "",
            m.priority ?? 0,
          ]
        );
      }
    }
  } catch (e) {
    console.error("Failed to sync all progress to local DB", e);
    throw e;
  }
}

/**
 * Legacy wrapper for backward compatibility.
 */
export async function syncTeamProgress(finalTeam: Pokemon[]): Promise<void> {
  return syncAllProgress(finalTeam, false);
}
