/**
 * savePokemon.ts
 *
 * Saves a caught Pokémon to both Supabase and SQLite.
 *
 * Supabase — stores all battle-relevant data (stats, images, moves)
 * SQLite   — stores ownership, level, experience, moveset, in_team flag
 *
 * Team cap logic:
 *   - If roster < 6 → save to Supabase + SQLite with in_team = true
 *   - If roster = 6 → save to Supabase, SQLite with in_team = false (box)
 *                      caller must handle the swap modal and call swapIntoTeam()
 *                      if the player wants this Pokémon on the team
 */
import {
  getTeamCountFromDb,
  saveInstanceToDb,
  setInTeamDb,
} from "@/src/lib/pokemonDb";
import { supabase } from "../lib/supabase";
import { Pokemon } from "../types/pokemon";

// ─── Save ─────────────────────────────────────────────────────────────────────

/**
 * Saves a caught Pokémon to Supabase and SQLite.
 *
 * Returns:
 *   { data, teamFull: false } — Pokémon added to active roster
 *   { data, teamFull: true  } — Team was full, Pokémon saved to box.
 *                               Show the swap modal then call swapIntoTeam().
 */
export async function savePokemon(
  pokemon: Pokemon,
  userId: string,
): Promise<{ data: any; teamFull: boolean }> {
  // ── Step 1: Insert into Supabase ──
  const { data, error } = await supabase
    .from("pokemon")
    .insert({
      user_id: userId,
      pk_name: pokemon.name,
      pk_level: pokemon.level,
      pk_hp: pokemon.hp,
      pk_max_hp: pokemon.maxHp,
      pk_attack: pokemon.attack,
      pk_defense: pokemon.defense,
      pk_special_attack: pokemon.specialAttack,
      pk_special_defense: pokemon.specialDefense,
      pk_speed: pokemon.speed,
      pk_types: pokemon.type,
      pk_front_image: pokemon.frontImage,
      pk_back_image: pokemon.backImage,
      pk_cry: pokemon.cry,
    })
    .select()
    .single();

  if (error) throw error;

  // ── Step 2: Insert moves into Supabase ──
  const moves = pokemon.moves.map((move) => ({
    pokemon_id: data.id,
    move_name: move.name,
    move_power: move.power,
    move_type: move.type ?? "normal",
    move_damageClass: move.damageClass,
    move_accuracy: move.accuracy,
    move_statChanges: move.statChanges ?? "none",
    move_description: move.description,
    move_priority: move.priority,
  }));

  const { error: movesError } = await supabase
    .from("pokemon_moves")
    .insert(moves);

  if (movesError) throw movesError;

  // ── Step 3: Check team size and mirror to SQLite ──
  const teamCount = await getTeamCountFromDb(userId);
  const teamFull = teamCount >= 6;

  // ── Step 4: Update pk_order in Supabase if not full ──
  if (!teamFull) {
    const { error: orderError } = await supabase
      .from("pokemon")
      .update({ pk_order: teamCount + 1 })
      .eq("id", data.id);
    
    if (orderError) console.error("Error setting pk_order:", orderError);
  } else {
    // Ensure it's null if full (though default is 0, user said use order numbers for team)
    await supabase
      .from("pokemon")
      .update({ pk_order: null })
      .eq("id", data.id);
  }

  await saveInstanceToDb(data.id, userId, pokemon, !teamFull);

  return { data, teamFull };
}

// ─── Swap ─────────────────────────────────────────────────────────────────────

/**
 * Swaps a boxed Pokémon into the team, benching the chosen team member.
 *
 * Call this after the player picks who to replace in the swap modal.
 *
 * @param newPokemonId    Supabase id of the newly caught Pokémon (currently in box)
 * @param replacedId      Supabase id of the team member being benched
 */
export async function swapIntoTeam(
  newPokemonId: string,
  replacedId: string,
): Promise<void> {
  // 1. Get the order of the pokemon we are replacing to maintain team position
  const { data: benchedPk, error: fetchError } = await supabase
    .from("pokemon")
    .select("pk_order")
    .eq("id", replacedId)
    .single();

  if (fetchError) throw fetchError;

  const targetOrder = benchedPk?.pk_order ?? 1;

  // 2. Flip flags in SQLite
  await Promise.all([
    setInTeamDb(newPokemonId, true),
    setInTeamDb(replacedId, false),
  ]);

  // 3. Update Supabase: 
  // - New pokemon takes the order of the benched one
  // - Benched pokemon order becomes null
  const { error: newPkError } = await supabase
    .from("pokemon")
    .update({ pk_order: targetOrder })
    .eq("id", newPokemonId);

  if (newPkError) throw newPkError;

  const { error: benchedError } = await supabase
    .from("pokemon")
    .update({ pk_order: null })
    .eq("id", replacedId);

  if (benchedError) throw benchedError;
}
