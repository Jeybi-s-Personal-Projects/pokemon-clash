import { supabase } from "../lib/supabase";
import { Pokemon } from "../types/pokemon";

export async function savePokemon(pokemon: Pokemon, userId: string) {
  // Insert the pokemon
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

  // Insert moves linked to that pokemon
  const moves = pokemon.moves.map((move) => ({
    pokemon_id: data.id,
    move_name: move.name,
    move_power: move.power,
    move_type: move.type,
  }));

  const { error: movesError } = await supabase
    .from("pokemon_moves")
    .insert(moves);

  if (movesError) throw movesError;

  return data;
}
