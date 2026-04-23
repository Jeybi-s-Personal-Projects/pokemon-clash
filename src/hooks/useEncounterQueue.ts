import {
  generateBatch,
  type Area,
  type Region,
} from "@/src/encounter/batchGenerator";
import type { EncounterPokemon, QueueEntry } from "@/src/encounter/types";
import { selectMoves } from "@/src/utils/moveSelector";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

// Local Pokémon DB types — adjust import path to match your project
import { gen1Pokemon } from "@/src/data/gen1Pokemon";
import { gen2Pokemon } from "@/src/data/gen2Pokemon";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Refill fires when queue drops to this many entries */
const REFILL_THRESHOLD = 5;

/** How many encounters to generate per batch */
const BATCH_SIZE = 10;

// ─── Local DB lookup ──────────────────────────────────────────────────────────

const ALL_LOCAL = [...gen1Pokemon, ...gen2Pokemon];

function getLocalData(id: number) {
  return ALL_LOCAL.find((p) => p.id === id);
}

// ─── Entry → EncounterPokemon ─────────────────────────────────────────────────

/**
 * Converts a QueueEntry into the EncounterPokemon shape the battle screen needs.
 * This is where selectMoves runs — pure JS, zero network cost.
 * Name/types/image come from local DB — also zero network cost.
 */
function hydrateEntry(entry: QueueEntry): EncounterPokemon {
  const local = getLocalData(entry.id);

  const baseUrl =
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown";

  const image = entry.isShiny
    ? `${baseUrl}/shiny/${entry.id}.gif`
    : `${baseUrl}/${entry.id}.gif`;

  const backImage = entry.isShiny
    ? `${baseUrl}/back/shiny/${entry.id}.gif`
    : `${baseUrl}/back/${entry.id}.gif`;

  return {
    id: entry.id,
    name: local?.name ?? `pokemon-${entry.id}`,
    types: local?.types ?? ["normal"],
    image: image,
    backImage: backImage,
    level: entry.level,
    isShiny: entry.isShiny,
    baseStats: entry.rawData.baseStats,
    moves: selectMoves(entry.rawData.rawMoves, entry.level),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseEncounterQueueReturn = {
  /** The current encounter, hydrated and ready for battle. Null while loading. */
  currentEncounter: EncounterPokemon | null;

  /** True only when currentEncounter is valid and battle can proceed. */
  isReady: boolean;

  /** True during the initial load (transition screen should be shown). */
  isInitialLoading: boolean;

  /** True when the queue is exhausted and a refill is mid-flight. */
  isRefilling: boolean;

  /** Advance to the next encounter. Call after Run / Catch / battle end. */
  advance: () => void;

  /** Reset the queue entirely — call when navigating away from battle. */
  reset: () => void;
};

export function useEncounterQueue(
  region: Region,
  area: Area,
): UseEncounterQueueReturn {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefilling, setIsRefilling] = useState(false);

  // Ref so refill logic always sees the current queue length
  // without stale closures
  const queueRef = useRef<QueueEntry[]>([]);
  const isRefillingRef = useRef(false);

  // ─── Refill logic ──────────────────────────────────────────────────────────

  const checkAndRefill = useCallback(async () => {
    // Guard: never two simultaneous refills
    if (isRefillingRef.current) return;
    // Guard: threshold not met
    if (queueRef.current.length > REFILL_THRESHOLD) return;

    isRefillingRef.current = true;
    setIsRefilling(true);

    try {
      const newEntries = await generateBatch(region, area, BATCH_SIZE);

      setQueue((prev) => {
        const updated = [...prev, ...newEntries];
        queueRef.current = updated;
        return updated;
      });
    } catch (err) {
      // generateBatch itself handles individual fetch failures via fallback,
      // so this catch is for truly catastrophic errors (bad region/area, etc.)
      console.error("[useEncounterQueue] generateBatch failed:", err);
    } finally {
      isRefillingRef.current = false;
      setIsRefilling(false);
    }
  }, [region, area]);

  // ─── Visibility change handler (mobile backgrounding) ──────────────────────

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // App returned to foreground — check if a refill was interrupted
        if (isRefillingRef.current) {
          isRefillingRef.current = false;
          setIsRefilling(false);
        }
        // Re-run threshold check in case queue drained while backgrounded
        checkAndRefill();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [region, area, checkAndRefill]);

  // ─── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setIsInitialLoading(true);
      setQueue([]);
      queueRef.current = [];

      try {
        const entries = await generateBatch(region, area, BATCH_SIZE);
        if (cancelled) return;

        setQueue(entries);
        queueRef.current = entries;
      } catch (err) {
        console.error("[useEncounterQueue] Initial load failed:", err);
      } finally {
        if (!cancelled) setIsInitialLoading(false);
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, [region, area]);

  // ─── Advance ───────────────────────────────────────────────────────────────

  const advance = useCallback(() => {
    setQueue((prev) => {
      const [, ...rest] = prev;
      queueRef.current = rest;

      // Trigger refill check after state update settles
      setTimeout(() => checkAndRefill(), 0);

      return rest;
    });
  }, [checkAndRefill]);

  // ─── Reset ─────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setQueue([]);
    queueRef.current = [];
    isRefillingRef.current = false;
    setIsRefilling(false);
    setIsInitialLoading(false);
  }, []);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const currentEntry = queue[0] ?? null;

  const currentEncounter = useMemo(() => {
    return currentEntry ? hydrateEntry(currentEntry) : null;
  }, [currentEntry]);

  const isReady = currentEncounter !== null && !isInitialLoading;

  return {
    currentEncounter,
    isReady,
    isInitialLoading,
    isRefilling,
    advance,
    reset,
  };
}
