import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Pokemon } from "../types/pokemon";

export function useTeam(userId: string) {
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchTeam();
  }, [userId]);

  const fetchTeam = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("pokemon")
      .select(`*, pokemon_moves(*)`)
      .eq("user_id", userId)
      .not("pk_order", "is", null)
      .neq("pk_order", 0)
      .order("pk_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const mapped: Pokemon[] = data.map((p: any) => ({
      id: p.id,
      pk_order: p.pk_order,
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
      frontImage: p.pk_front_image,
      backImage: p.pk_back_image,
      cry: p.pk_cry,
      moves: p.pokemon_moves.map((m: any) => ({
        name: m.move_name,
        power: m.move_power,
        type: m.move_type,
      })),
    }));

    setTeam(mapped);
    setLoading(false);
  };

  return { team, loading, refetch: fetchTeam };
}
