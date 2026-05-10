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
 */
export async function savePokemon(
  pokemon: Pokemon,
  userId: string,
): Promise<{ data: any; teamFull: boolean }> {
  // ── Step 1: Insert into Supabase ──
  // Note: We save caught pokemon with FULL HP.
  const { data, error } = await supabase
    .from("pokemon")
    .insert({
      user_id: userId,
      pk_species_id: pokemon.speciesId,
      pk_name: pokemon.name,
      pk_level: pokemon.level,
      pk_experience: pokemon.experience,
      pk_hp: pokemon.maxHp, // Fully heal caught pokemon
      pk_max_hp: pokemon.maxHp,
      pk_attack: pokemon.attack,
      pk_defense: pokemon.defense,
      pk_special_attack: pokemon.specialAttack,
      pk_special_defense: pokemon.specialDefense,
      pk_speed: pokemon.speed,
      pk_types: pokemon.type,
      pk_ability: pokemon.ability,
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
    move_power: move.power ?? 0,
    move_pp: move.pp ?? 0,
    move_type: move.type ?? "normal",
    move_damageClass: move.damageClass ?? "status",
    move_accuracy: move.accuracy ?? 100,
    move_statChanges: move.statChanges ? JSON.stringify(move.statChanges) : "[]",
    move_description: move.description ?? "",
    move_priority: move.priority ?? 0,
  }));

  const { error: movesError } = await supabase
    .from("pokemon_moves")
    .insert(moves);

  if (movesError) {
    console.error("Error saving moves for caught pokemon:", movesError);
    // We don't throw here to avoid failing the whole catch, 
    // but the pokemon will have no moves in the DB.
  }

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
 * Swaps a boxed Pokémon into the team.
 */
export async function swapIntoTeam(
  newPokemonId: string,
  replacedId: string,
): Promise<void> {
  const { data: benchedPk, error: fetchError } = await supabase
    .from("pokemon")
    .select("pk_order")
    .eq("id", replacedId)
    .single();

  if (fetchError) throw fetchError;

  const targetOrder = benchedPk?.pk_order ?? 1;

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

// ─── Sync ─────────────────────────────────────────────────────────────────────

/**
 * Robustly syncs the entire team's progress to Supabase,
 * including their current movesets.
 */
export async function syncAllProgress(
  finalTeam: Pokemon[],
  shouldHeal: boolean = false,
): Promise<void> {
  try {
    const syncData = finalTeam
      .filter((p) => !!p.id)
      .map((p) => ({
        id: p.id,
        pk_species_id: p.speciesId,
        pk_name: p.name,
        pk_types: p.type,
        pk_ability: p.ability,
        pk_front_image: p.frontImage,
        pk_back_image: p.backImage,
        pk_cry: p.cry,
        pk_level: p.level,
        pk_experience: p.experience,
        pk_hp: shouldHeal ? p.maxHp : p.hp,
        pk_max_hp: p.maxHp,
        pk_attack: p.attack,
        pk_defense: p.defense,
        pk_special_attack: p.specialAttack,
        pk_special_defense: p.specialDefense,
        pk_speed: p.speed,
      }));

    if (syncData.length === 0) return;

    // 1. Upsert stats
    const { error: pokemonError } = await supabase.from("pokemon").upsert(syncData);
    if (pokemonError) throw pokemonError;

    // 2. Sync moves for each pokemon
    // To ensure moves are always accurate, we delete and re-insert.
    for (const p of finalTeam) {
      if (!p.id) continue;

      // Skip move sync if moves array is empty/invalid
      if (!p.moves || p.moves.length === 0) continue;

      // Delete existing moves
      await supabase.from("pokemon_moves").delete().eq("pokemon_id", p.id);

      // Insert current moves
      const movesToInsert = p.moves.map((m) => ({
        pokemon_id: p.id,
        move_name: m.name,
        move_power: m.power ?? 0,
        move_pp: m.pp ?? 0,
        move_type: m.type ?? "normal",
        move_damageClass: m.damageClass ?? "status",
        move_accuracy: m.accuracy ?? 100,
        move_statChanges: m.statChanges ? JSON.stringify(m.statChanges) : "[]",
        move_description: m.description ?? "",
        move_priority: m.priority ?? 0,
      }));

      const { error: movesError } = await supabase
        .from("pokemon_moves")
        .insert(movesToInsert);
      
      if (movesError) console.error(`Error syncing moves for ${p.name}:`, movesError);
    }
  } catch (e) {
    console.error("Failed to sync all progress", e);
    throw e;
  }
}

/**
 * Legacy wrapper for backward compatibility.
 */
export async function syncTeamProgress(finalTeam: Pokemon[]): Promise<void> {
  return syncAllProgress(finalTeam, false);
}
