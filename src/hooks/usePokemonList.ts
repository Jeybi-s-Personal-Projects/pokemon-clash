import { useEffect, useState } from "react";
import db from "../lib/db";

export function usePokemonList(userId: string) {
  const [pokemon, setPokemon] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchList();
  }, [userId]);

  const fetchList = async () => {
    setLoading(true);
    try {
      // 1. Fetch all Pokémon for this user
      const pokemonRows = db.getAllSync<any>(
        `SELECT * FROM pokemon WHERE user_id = ? ORDER BY created_at ASC`,
        [userId]
      );

      const mapped = pokemonRows.map((p: any) => {
        // 2. Fetch moves for each Pokémon
        const moveRows = db.getAllSync<any>(
          `SELECT * FROM pokemon_moves WHERE pokemon_id = ?`,
          [p.id]
        );

        return {
          id: p.id,
          name: p.pk_name,
          level: p.pk_level,
          hp: p.pk_hp,
          maxHp: p.pk_max_hp,
          attack: p.pk_attack || 0,
          defense: p.pk_defense || 0,
          specialAttack: p.pk_special_attack || 0,
          specialDefense: p.pk_special_defense || 0,
          speed: p.pk_speed || 0,
          type: JSON.parse(p.pk_types),
          ability: p.pk_ability,
          heldItem: p.pk_held_item,
          frontImage: p.pk_front_image,
          backImage: p.pk_back_image,
          cry: p.pk_cry,
          moves: moveRows.map((m: any) => ({
            id: m.id,
            name: m.move_name,
            power: m.move_power,
            type: m.move_type,
          })),
          created_at: p.created_at,
          pk_name: p.pk_name, // keep for compatibility
        };
      });

      setPokemon(mapped);
    } catch (error) {
      console.error("Error fetching pokemon list from local DB:", error);
      setPokemon([]);
    } finally {
      setLoading(false);
    }
  };

  return { pokemon, loading, refetch: fetchList };
}
