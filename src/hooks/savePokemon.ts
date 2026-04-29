/**
 * savePokemon.ts
 *
 * Saves a caught Pokémon to Supabase.
 *
 * Supabase — stores all battle-relevant data (stats, images, moves)
 *
 * Team cap logic:
 *   - If roster < 6 → save to Supabase with a pk_order (active)
 *   - If roster = 6 → save to Supabase with pk_order = null (boxed)
 *                      caller must handle the swap modal and call swapIntoTeam()
 *                      if the player wants this Pokémon on the team
 */
import { supabase } from "../lib/supabase";
import { Pokemon } from "../types/pokemon";

// ─── Save ─────────────────────────────────────────────────────────────────────

/**
 * Saves a caught Pokémon to Supabase.
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
      pk_species_id: pokemon.speciesId,
      pk_name: pokemon.name,
      pk_level: pokemon.level,
      pk_experience: pokemon.experience,
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
      pk_order: null, // Initially null
    })
    .select()
    .single();

  if (error) throw error;

  // ── Step 2: Insert moves into Supabase ──
  const moves = pokemon.moves.map((move) => ({
    pokemon_id: data.id,
    move_name: move.name,
    move_power: move.power,
    move_pp: move.pp,
    move_type: move.type ?? "normal",
    move_damageClass: move.damageClass,
    move_accuracy: move.accuracy,
    move_statChanges: move.statChanges ? JSON.stringify(move.statChanges) : "[]",
    move_description: move.description,
    move_priority: move.priority,
  }));

  const { error: movesError } = await supabase
    .from("pokemon_moves")
    .insert(moves);

  if (movesError) throw movesError;

  // ── Step 3: Check team size from Supabase ──
  const { count, error: countError } = await supabase
    .from("pokemon")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("pk_order", "is", null)
    .neq("pk_order", 0);

  if (countError) throw countError;

  const teamCount = count ?? 0;
  const teamFull = teamCount >= 6;

  // ── Step 4: Update pk_order if not full ──
  if (!teamFull) {
    const { error: orderError } = await supabase
      .from("pokemon")
      .update({ pk_order: teamCount + 1 })
      .eq("id", data.id);
    
    if (orderError) console.error("Error setting pk_order:", orderError);
  }

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

  // 2. Update Supabase: 
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
