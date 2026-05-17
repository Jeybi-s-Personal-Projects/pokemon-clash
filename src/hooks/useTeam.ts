import { useEffect, useState } from "react";
import { MOVES } from "../data/pokemon/moves/moves";
import db from "../lib/db";
import { Pokemon } from "../types/pokemon";
import { getGrowthRate } from "../utils/experienceCalculator";

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

    try {
      // 1. Fetch Pokémon from team
      const pokemonRows = db.getAllSync<any>(
        `SELECT * FROM pokemon 
         WHERE user_id = ? AND pk_order IS NOT NULL AND pk_order != 0
         ORDER BY pk_order ASC, created_at ASC`,
        [userId]
      );

      const mapped: Pokemon[] = pokemonRows.map((p) => {
        const speciesId = p.pk_species_id || 1;
        
        // 2. Fetch moves for this Pokémon
        const moveRows = db.getAllSync<any>(
          `SELECT * FROM pokemon_moves WHERE pokemon_id = ?`,
          [p.id]
        );

        return {
          id: p.id,
          speciesId,
          pk_order: p.pk_order,
          name: p.pk_name,
          level: p.pk_level,
          experience: p.pk_experience || 0,
          growthRate: getGrowthRate(speciesId),
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
          isShiny: !!p.pk_is_shiny,
          cry: p.pk_cry,
          moves: moveRows.map((m: any) => {
            const slug = m.move_name.toLowerCase().replace(/[\s]/g, "-");
            const detail = MOVES[slug] || {};
            return {
              id: m.id,
              name: m.move_name,
              power: m.move_power ?? detail.power ?? 0,
              pp: m.move_pp ?? detail.pp ?? 0,
              maxPp: m.move_max_pp || detail.pp || m.move_pp || 0,
              type: m.move_type || detail.type,
              damageClass: m.move_damageClass || detail.damageClass,
              accuracy: m.move_accuracy ?? detail.accuracy,
              statChanges: m.move_statChanges ? JSON.parse(m.move_statChanges) : (detail.statChanges || []),
              description: m.move_description || detail.description,
              priority: m.move_priority ?? detail.priority,
            };
          }),
        };
      });

      setTeam(mapped);
    } catch (error) {
      console.error("Error fetching team from local DB:", error);
    } finally {
      setLoading(false);
    }
  };

  return { team, loading, refetch: fetchTeam };
}
