import { useCallback, useEffect, useState } from "react";
import db from "../lib/db";
import { ITEMS, Item } from "../data/items/items";

export type InventoryItem = Item & {
  quantity: number;
};

export function useInventory(userId: string | undefined) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const rows = db.getAllSync<{ item_id: string; quantity: number }>(
        `SELECT item_id, quantity FROM inventory WHERE user_id = ? AND quantity > 0`,
        [userId]
      );

      const items: InventoryItem[] = rows.map((row) => {
        const staticItem = ITEMS.find((i) => i.id === row.item_id);
        if (!staticItem) return null;
        return {
          ...staticItem,
          quantity: row.quantity,
        };
      }).filter((item): item is InventoryItem => item !== null);

      setInventory(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addItem = (itemId: string, amount: number = 1) => {
    if (!userId) return;

    db.runSync(
      `INSERT INTO inventory (user_id, item_id, quantity) 
       VALUES (?, ?, ?) 
       ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP`,
      [userId, itemId, amount, amount]
    );
    fetchInventory();
  };

  const consumeItem = (itemId: string, amount: number = 1) => {
    if (!userId) return;

    db.runSync(
      `UPDATE inventory SET quantity = MAX(0, quantity - ?), updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND item_id = ?`,
      [amount, userId, itemId]
    );
    fetchInventory();
  };

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return { inventory, loading, addItem, consumeItem, refetch: fetchInventory };
}

/**
 * Helper to grant starter items to a new user.
 */
export function grantStarterItems(userId: string) {
  const starterItems = [
    { id: "poke-ball", quantity: 10 },
    { id: "great-ball", quantity: 5 },
    { id: "ultra-ball", quantity: 1 },
    { id: "potion", quantity: 5 },
  ];

  for (const item of starterItems) {
    db.runSync(
      `INSERT INTO inventory (user_id, item_id, quantity) 
       VALUES (?, ?, ?) 
       ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP`,
      [userId, item.id, item.quantity, item.quantity]
    );
  }
}
