import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
      const { data, error } = await supabase
        .from("pokemon")
        .select(`*, pokemon_moves(*)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        setPokemon([]);
        return;
      }

      const mapped = (data ?? []).map((p: any) => ({
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
        type: p.pk_types,
        ability: p.pk_ability,
        heldItem: p.pk_held_item,
        frontImage: p.pk_front_image,
        backImage: p.pk_back_image,
        cry: p.pk_cry,
        moves: p.pokemon_moves.map((m: any) => ({
          name: m.move_name,
          power: m.move_power,
          type: m.move_type,
        })),
        created_at: p.created_at,
        pk_name: p.pk_name, // keep for compatibility if needed
      }));
      setPokemon(mapped);
    } finally {
      setLoading(false);
    }
  };

  return { pokemon, loading, refetch: fetchList };
}
