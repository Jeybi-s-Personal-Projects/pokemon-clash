import { useCallback, useEffect, useState } from "react";
import db from "../lib/db";

export type TrainerStats = {
  user_id: string;
  pokecoins: number;
  total_battles: number;
  total_wins: number;
  highest_streak: number;
  updated_at: string;
};

export function useTrainer(userId: string | undefined) {
  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const row = db.getFirstSync<TrainerStats>(
        `SELECT * FROM trainer_stats WHERE user_id = ?`,
        [userId]
      );

      if (row) {
        setStats(row);
      } else {
        // Initialize stats if they don't exist
        db.runSync(
          `INSERT INTO trainer_stats (user_id, pokecoins, total_battles, total_wins, highest_streak) 
           VALUES (?, 0, 0, 0, 0)`,
          [userId]
        );
        const newRow = db.getFirstSync<TrainerStats>(
          `SELECT * FROM trainer_stats WHERE user_id = ?`,
          [userId]
        );
        setStats(newRow || null);
      }
    } catch (error) {
      console.error("Error fetching trainer stats:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
