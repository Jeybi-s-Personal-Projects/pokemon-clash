/**
 * items.ts — static Gen 1 + Gen 2 Pokémon items + Mega Evolution Stones
 *
 * Each entry describes one item with a typed category and relevant metadata.
 *
 * ──────────────────────────────────────────────────────────────────
 * DATA STRUCTURE DESIGN NOTES
 * ──────────────────────────────────────────────────────────────────
 *
 * ItemCategory is a discriminated union on the `category` field.
 * This lets TypeScript narrow the type safely and filter by category:
 *
 *   const stones = ITEMS.filter(
 *     (i): i is Item<EvolutionStoneCategory> =>
 *       i.category === "evolution-stone"
 *   );
 *
 * Current category types:
 *
 *   "evolution-stone"  — Items used to evolve specific Pokémon.
 *                        (e.g. "fire-stone", "water-stone", "moon-stone")
 *
 *   "held-item"        — Items held by Pokémon for various effects.
 *                        (e.g. "leftovers", "kings-rock", "metal-coat")
 *
 *   "medicine"         — Healing items used from the bag.
 *                        (e.g. "potion", "antidote", "full-restore")
 *
 *   "pokeball"         — Balls used to catch Pokémon.
 *                        (e.g. "poke-ball", "great-ball", "master-ball")
 *
 *   "battle-item"      — Items used during battle for stat boosts or effects.
 *                        (e.g. "x-attack", "guard-spec", "dire-hit")
 *
 *   "berry"            — Berries with passive or active effects. (Gen 2)
 *                        (e.g. "oran-berry", "sitrus-berry", "lum-berry")
 *
 *   "mega-stone"       — Stones that trigger Mega Evolution in battle.
 *                        megaOf names the Pokémon that uses the stone.
 *                        (e.g. "venusaurite", "charizardite-x", "mewtwonite-y")
 *
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvolutionStoneCategory = {
  category: "evolution-stone";
  /** Pokémon name(s) that can use this stone to evolve. */
  usedBy: string[];
};

export type HeldItemCategory = {
  category: "held-item";
  /** Short description of the held effect. */
  effect: string;
};

export type MedicineCategory = {
  category: "medicine";
  /** What the medicine restores or cures. */
  effect: string;
};

export type PokeballCategory = {
  category: "pokeball";
  /** Catch rate multiplier description. */
  catchRate: string;
};

export type BattleItemCategory = {
  category: "battle-item";
  /** Effect when used in battle. */
  effect: string;
};

export type BerryCategory = {
  category: "berry";
  /** Effect of the berry when held or used. */
  effect: string;
};

export type TmHmCategory = {
  category: "tm-hm";
  /** Move taught by this TM or HM. */
  move: string;
  /** Whether this is a HM (cannot be deleted). */
  isHm: boolean;
};

export type MegaStoneCategory = {
  category: "mega-stone";
  /** The Pokémon species this stone belongs to. */
  megaOf: string;
  /** The Mega Evolution form unlocked (e.g. "mega-charizard-x"). */
  megaForm: string;
  effect: string;
};

export type OtherCategory = {
  category: "other";
  /** Human-readable description of what the item does. */
  description: string;
};

/** Discriminated union — narrow via `category`. */
export type ItemCategory =
  | EvolutionStoneCategory
  | HeldItemCategory
  | MedicineCategory
  | PokeballCategory
  | BattleItemCategory
  | BerryCategory
  | TmHmCategory
  | MegaStoneCategory
  | OtherCategory;

export type Item<C extends ItemCategory = ItemCategory> = {
  /** Unique kebab-case identifier (matches PokeAPI naming conventions). */
  id: string;
  /** Display name of the item. */
  name: string;
  /** National Pokédex generation this item was introduced in. */
  gen: 1 | 2 | 6 | 7 | 8; // Mega Stones introduced in Gen 6+
  /** Typed category describing what kind of item this is. */
  category: C;
  /** Description for UI display. */
  description?: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

export const ITEMS: Item[] = [
  // ══════════════════════════════════════════════════════════════════
  // EVOLUTION STONES — Gen 1
  // ══════════════════════════════════════════════════════════════════

  {
    id: "fire-stone",
    name: "Fire Stone",
    gen: 1,
    category: {
      category: "evolution-stone",
      usedBy: ["vulpix", "growlithe", "eevee"],
    },
  },
  {
    id: "water-stone",
    name: "Water Stone",
    gen: 1,
    category: {
      category: "evolution-stone",
      usedBy: ["poliwag", "shellder", "staryu", "eevee"],
    },
  },
  {
    id: "thunder-stone",
    name: "Thunder Stone",
    gen: 1,
    category: { category: "evolution-stone", usedBy: ["pikachu", "eevee"] },
  },
  {
    id: "leaf-stone",
    name: "Leaf Stone",
    gen: 1,
    category: {
      category: "evolution-stone",
      usedBy: ["gloom", "weepinbell", "exeggcute"],
    },
  },
  {
    id: "moon-stone",
    name: "Moon Stone",
    gen: 1,
    category: {
      category: "evolution-stone",
      usedBy: ["nidorina", "nidorino", "clefairy", "jigglypuff"],
    },
  },

  // EVOLUTION STONES — Gen 2
  {
    id: "sun-stone",
    name: "Sun Stone",
    gen: 2,
    category: { category: "evolution-stone", usedBy: ["gloom", "sunkern"] },
  },
  {
    id: "kings-rock",
    name: "King's Rock",
    gen: 2,
    category: {
      category: "evolution-stone",
      usedBy: ["poliwhirl", "slowpoke"],
    },
  },
  {
    id: "metal-coat",
    name: "Metal Coat",
    gen: 2,
    category: { category: "evolution-stone", usedBy: ["onix", "scyther"] },
  },
  {
    id: "dragon-scale",
    name: "Dragon Scale",
    gen: 2,
    category: { category: "evolution-stone", usedBy: ["seadra"] },
  },
  {
    id: "up-grade",
    name: "Up-Grade",
    gen: 2,
    category: { category: "evolution-stone", usedBy: ["porygon"] },
  },

  // ══════════════════════════════════════════════════════════════════
  // MEDICINE — Gen 1
  // ══════════════════════════════════════════════════════════════════

  {
    id: "potion",
    name: "Potion",
    gen: 1,
    category: {
      category: "medicine",
      effect: "Restores 20 HP to one Pokémon.",
    },
  },
  {
    id: "super-potion",
    name: "Super Potion",
    gen: 1,
    category: {
      category: "medicine",
      effect: "Restores 50 HP to one Pokémon.",
    },
  },
  {
    id: "hyper-potion",
    name: "Hyper Potion",
    gen: 1,
    category: {
      category: "medicine",
      effect: "Restores 200 HP to one Pokémon.",
    },
  },
  {
    id: "max-potion",
    name: "Max Potion",
    gen: 1,
    category: {
      category: "medicine",
      effect: "Fully restores HP of one Pokémon.",
    },
  },
  {
    id: "full-restore",
    name: "Full Restore",
    gen: 1,
    category: {
      category: "medicine",
      effect: "Fully restores HP and cures all status conditions.",
    },
  },
  {
    id: "revive",
    name: "Revive",
    gen: 1,
    category: {
      category: "medicine",
      effect: "Revives a fainted Pokémon to half its max HP.",
    },
  },
  {
    id: "max-revive",
    name: "Max Revive",
    gen: 1,
    category: {
      category: "medicine",
      effect: "Revives a fainted Pokémon to full HP.",
    },
  },
  {
    id: "antidote",
    name: "Antidote",
    gen: 1,
    category: { category: "medicine", effect: "Cures poison." },
  },
  {
    id: "burn-heal",
    name: "Burn Heal",
    gen: 1,
    category: { category: "medicine", effect: "Cures burn." },
  },
  {
    id: "ice-heal",
    name: "Ice Heal",
    gen: 1,
    category: { category: "medicine", effect: "Cures freeze." },
  },
  {
    id: "awakening",
    name: "Awakening",
    gen: 1,
    category: { category: "medicine", effect: "Cures sleep." },
  },
  {
    id: "parlyz-heal",
    name: "Parlyz Heal",
    gen: 1,
    category: { category: "medicine", effect: "Cures paralysis." },
  },
  {
    id: "full-heal",
    name: "Full Heal",
    gen: 1,
    category: { category: "medicine", effect: "Cures all status conditions." },
  },
  {
    id: "ether",
    name: "Ether",
    gen: 1,
    category: { category: "medicine", effect: "Restores 10 PP of one move." },
  },
  {
    id: "max-ether",
    name: "Max Ether",
    gen: 1,
    category: {
      category: "medicine",
      effect: "Fully restores PP of one move.",
    },
  },
  {
    id: "elixir",
    name: "Elixir",
    gen: 1,
    category: { category: "medicine", effect: "Restores 10 PP of all moves." },
  },
  {
    id: "max-elixir",
    name: "Max Elixir",
    gen: 1,
    category: {
      category: "medicine",
      effect: "Fully restores PP of all moves.",
    },
  },

  // MEDICINE — Gen 2
  {
    id: "berry-juice",
    name: "Berry Juice",
    gen: 2,
    category: {
      category: "medicine",
      effect: "Restores 20 HP to one Pokémon.",
    },
  },
  {
    id: "sacred-ash",
    name: "Sacred Ash",
    gen: 2,
    category: {
      category: "medicine",
      effect: "Revives all fainted Pokémon to full HP.",
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // POKÉ BALLS — Gen 1
  // ══════════════════════════════════════════════════════════════════

  {
    id: "poke-ball",
    name: "Poké Ball",
    gen: 1,
    category: { category: "pokeball", catchRate: "1× catch rate." },
  },
  {
    id: "great-ball",
    name: "Great Ball",
    gen: 1,
    category: { category: "pokeball", catchRate: "1.5× catch rate." },
  },
  {
    id: "ultra-ball",
    name: "Ultra Ball",
    gen: 1,
    category: { category: "pokeball", catchRate: "2× catch rate." },
  },
  {
    id: "master-ball",
    name: "Master Ball",
    gen: 1,
    category: {
      category: "pokeball",
      catchRate: "Catches any Pokémon without fail.",
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // BATTLE ITEMS — Gen 1
  // ══════════════════════════════════════════════════════════════════

  {
    id: "x-attack",
    name: "X Attack",
    gen: 1,
    category: {
      category: "battle-item",
      effect: "Raises Attack by 1 stage for the duration of the battle.",
    },
  },
  {
    id: "x-defend",
    name: "X Defend",
    gen: 1,
    category: {
      category: "battle-item",
      effect: "Raises Defense by 1 stage for the duration of the battle.",
    },
  },
  {
    id: "x-speed",
    name: "X Speed",
    gen: 1,
    category: {
      category: "battle-item",
      effect: "Raises Speed by 1 stage for the duration of the battle.",
    },
  },
  {
    id: "x-special",
    name: "X Special",
    gen: 1,
    category: {
      category: "battle-item",
      effect:
        "Raises Special Attack by 1 stage for the duration of the battle.",
    },
  },
  {
    id: "x-accuracy",
    name: "X Accuracy",
    gen: 1,
    category: {
      category: "battle-item",
      effect: "Raises Accuracy by 1 stage for the duration of the battle.",
    },
  },
  {
    id: "guard-spec",
    name: "Guard Spec.",
    gen: 1,
    category: {
      category: "battle-item",
      effect: "Prevents stat reduction for all party Pokémon for 5 turns.",
    },
  },
  {
    id: "dire-hit",
    name: "Dire Hit",
    gen: 1,
    category: {
      category: "battle-item",
      effect: "Raises critical-hit ratio for one Pokémon for the battle.",
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // HELD ITEMS — Gen 1
  // ══════════════════════════════════════════════════════════════════

  {
    id: "lucky-punch",
    name: "Lucky Punch",
    gen: 1,
    category: {
      category: "held-item",
      effect: "Raises Chansey's critical-hit ratio.",
    },
  },
  {
    id: "stick",
    name: "Stick",
    gen: 1,
    category: {
      category: "held-item",
      effect: "Raises Farfetch'd's critical-hit ratio.",
    },
  },
  {
    id: "thick-club",
    name: "Thick Club",
    gen: 1,
    category: {
      category: "held-item",
      effect: "Doubles Cubone and Marowak's Attack stat.",
    },
  },
  {
    id: "light-ball",
    name: "Light Ball",
    gen: 1,
    category: {
      category: "held-item",
      effect: "Doubles Pikachu's Special Attack (and Attack in Gen 4+).",
    },
  },

  // HELD ITEMS — Gen 2
  {
    id: "leftovers",
    name: "Leftovers",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Restores 1/16 of max HP each turn.",
    },
  },
  {
    id: "shell-bell",
    name: "Shell Bell",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Restores HP equal to 1/8 of damage dealt.",
    },
  },
  {
    id: "scope-lens",
    name: "Scope Lens",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Raises the holder's critical-hit ratio by 1 stage.",
    },
  },
  {
    id: "choice-band",
    name: "Choice Band",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Attack by 1.5×; holder is locked into one move.",
    },
  },
  {
    id: "quick-claw",
    name: "Quick Claw",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Gives a 20% chance to move first regardless of Speed.",
    },
  },
  {
    id: "bright-powder",
    name: "Bright Powder",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Reduces the accuracy of moves targeting the holder by 10%.",
    },
  },
  {
    id: "lax-incense",
    name: "Lax Incense",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Reduces the accuracy of moves targeting the holder by 10%.",
    },
  },
  {
    id: "white-herb",
    name: "White Herb",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Restores any lowered stats once, then is consumed.",
    },
  },
  {
    id: "mental-herb",
    name: "Mental Herb",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Cures infatuation once, then is consumed.",
    },
  },
  {
    id: "black-belt",
    name: "Black Belt",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Fighting-type moves by 20%.",
    },
  },
  {
    id: "black-glasses",
    name: "Black Glasses",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Dark-type moves by 20%.",
    },
  },
  {
    id: "charcoal",
    name: "Charcoal",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Fire-type moves by 20%.",
    },
  },
  {
    id: "dragon-fang",
    name: "Dragon Fang",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Dragon-type moves by 20%.",
    },
  },
  {
    id: "hard-stone",
    name: "Hard Stone",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Rock-type moves by 20%.",
    },
  },
  {
    id: "magnet",
    name: "Magnet",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Electric-type moves by 20%.",
    },
  },
  {
    id: "miracle-seed",
    name: "Miracle Seed",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Grass-type moves by 20%.",
    },
  },
  {
    id: "mystic-water",
    name: "Mystic Water",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Water-type moves by 20%.",
    },
  },
  {
    id: "never-melt-ice",
    name: "Never-Melt Ice",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Ice-type moves by 20%.",
    },
  },
  {
    id: "pink-bow",
    name: "Pink Bow",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Normal-type moves by 10%.",
    },
  },
  {
    id: "polkadot-bow",
    name: "Polkadot Bow",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Normal-type moves by 10%.",
    },
  },
  {
    id: "poison-barb",
    name: "Poison Barb",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Poison-type moves by 20%.",
    },
  },
  {
    id: "sharp-beak",
    name: "Sharp Beak",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Flying-type moves by 20%.",
    },
  },
  {
    id: "silk-scarf",
    name: "Silk Scarf",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Normal-type moves by 20%.",
    },
  },
  {
    id: "silverpowder",
    name: "SilverPowder",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Bug-type moves by 20%.",
    },
  },
  {
    id: "soft-sand",
    name: "Soft Sand",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Ground-type moves by 20%.",
    },
  },
  {
    id: "spell-tag",
    name: "Spell Tag",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Ghost-type moves by 20%.",
    },
  },
  {
    id: "twisted-spoon",
    name: "Twisted Spoon",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Boosts Psychic-type moves by 20%.",
    },
  },
  {
    id: "amulet-coin",
    name: "Amulet Coin",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Doubles prize money if holder participates in battle.",
    },
  },
  {
    id: "cleanse-tag",
    name: "Cleanse Tag",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Reduces wild Pokémon encounters when held by the lead Pokémon.",
    },
  },
  {
    id: "exp-share",
    name: "Exp. Share",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Shares Exp. Points with the holder even if it didn't battle.",
    },
  },
  {
    id: "lucky-egg",
    name: "Lucky Egg",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Holder gains 50% more Exp. Points from battles.",
    },
  },
  {
    id: "focus-band",
    name: "Focus Band",
    gen: 2,
    category: {
      category: "held-item",
      effect:
        "10% chance to survive a hit that would knock out the holder with 1 HP.",
    },
  },
  {
    id: "macho-brace",
    name: "Macho Brace",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Halves Speed but doubles EVs gained.",
    },
  },
  {
    id: "smoke-ball",
    name: "Smoke Ball",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Guarantees escape from wild Pokémon battles.",
    },
  },
  {
    id: "berserk-gene",
    name: "Berserk Gene",
    gen: 2,
    category: {
      category: "held-item",
      effect: "Maximises Attack but causes confusion; consumed on use.",
    },
  },

  //   {
  //   id: "choice-scarf",
  //   name: "Choice Scarf",
  //   gen: 3,
  //   category: {
  //     category: "held-item",
  //     effect: "Boosts Speed by 1.5× but locks holder into one move.",
  //   },
  // },
  // {
  //   id: "choice-band",
  //   name: "Choice Band",
  //   gen: 3,
  //   category: {
  //     category: "held-item",
  //     effect: "Boosts Attack by 1.5× but locks holder into one move.",
  //   },
  // },
  // {
  //   id: "choice-specs",
  //   name: "Choice Specs",
  //   gen: 3,
  //   category: {
  //     category: "held-item",
  //     effect: "Boosts Special Attack by 1.5× but locks holder into one move.",
  //   },
  // },
  // {
  //   id: "life-orb",
  //   name: "Life Orb",
  //   gen: 4,
  //   category: {
  //     category: "held-item",
  //     effect: "Boosts damage by 30% but loses 10% HP on attack.",
  //   },
  // },
  // {
  //   id: "focus-sash",
  //   name: "Focus Sash",
  //   gen: 4,
  //   category: {
  //     category: "held-item",
  //     effect: "Survives a hit at full HP with 1 HP remaining.",
  //   },
  // },
  // {
  //   id: "assault-vest",
  //   name: "Assault Vest",
  //   gen: 6,
  //   category: {
  //     category: "held-item",
  //     effect: "Boosts Special Defense by 50% but prevents status moves.",
  //   },
  // },
  // {
  //   id: "rocky-helmet",
  //   name: "Rocky Helmet",
  //   gen: 5,
  //   category: {
  //     category: "held-item",
  //     effect: "Damages attackers that use contact moves.",
  //   },
  // },
  // {
  //   id: "expert-belt",
  //   name: "Expert Belt",
  //   gen: 4,
  //   category: {
  //     category: "held-item",
  //     effect: "Boosts super-effective move damage by 20%.",
  //   },
  // },
  // {
  //   id: "eviolite",
  //   name: "Eviolite",
  //   gen: 5,
  //   category: {
  //     category: "held-item",
  //     effect: "Boosts Defense and Sp. Def of unevolved Pokémon by 50%.",
  //   },
  // },
  // {
  //   id: "black-sludge",
  //   name: "Black Sludge",
  //   gen: 4,
  //   category: {
  //     category: "held-item",
  //     effect: "Restores HP each turn for Poison types; damages others.",
  //   },
  // },
  // {
  //   id: "toxic-orb",
  //   name: "Toxic Orb",
  //   gen: 4,
  //   category: {
  //     category: "held-item",
  //     effect: "Badly poisons holder after one turn.",
  //   },
  // },
  // {
  //   id: "flame-orb",
  //   name: "Flame Orb",
  //   gen: 4,
  //   category: {
  //     category: "held-item",
  //     effect: "Burns holder after one turn.",
  //   },
  // },
  // {
  //   id: "air-balloon",
  //   name: "Air Balloon",
  //   gen: 5,
  //   category: {
  //     category: "held-item",
  //     effect: "Grants immunity to Ground-type moves until hit.",
  //   },
  // },
  // {
  //   id: "weakness-policy",
  //   name: "Weakness Policy",
  //   gen: 6,
  //   category: {
  //     category: "held-item",
  //     effect: "Raises Attack and Sp. Atk by 2 stages when hit super-effectively.",
  //   },
  // },

  // ══════════════════════════════════════════════════════════════════
  // BERRIES — Gen 2
  // ══════════════════════════════════════════════════════════════════

  {
    id: "oran-berry",
    name: "Oran Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Restores 10 HP when holder's HP drops to 50% or below.",
    },
  },
  {
    id: "sitrus-berry",
    name: "Sitrus Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Restores 25% of max HP when holder's HP drops to 50% or below.",
    },
  },
  {
    id: "lum-berry",
    name: "Lum Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Cures any status condition and confusion.",
    },
  },
  {
    id: "rawst-berry",
    name: "Rawst Berry",
    gen: 2,
    category: { category: "berry", effect: "Cures burn." },
  },
  {
    id: "chesto-berry",
    name: "Chesto Berry",
    gen: 2,
    category: { category: "berry", effect: "Cures sleep." },
  },
  {
    id: "pecha-berry",
    name: "Pecha Berry",
    gen: 2,
    category: { category: "berry", effect: "Cures poison." },
  },
  {
    id: "aspear-berry",
    name: "Aspear Berry",
    gen: 2,
    category: { category: "berry", effect: "Cures freeze." },
  },
  {
    id: "cheri-berry",
    name: "Cheri Berry",
    gen: 2,
    category: { category: "berry", effect: "Cures paralysis." },
  },
  {
    id: "persim-berry",
    name: "Persim Berry",
    gen: 2,
    category: { category: "berry", effect: "Cures confusion." },
  },
  {
    id: "leppa-berry",
    name: "Leppa Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Restores 10 PP of a depleted move.",
    },
  },
  {
    id: "figy-berry",
    name: "Figy Berry",
    gen: 2,
    category: {
      category: "berry",
      effect:
        "Restores 1/8 max HP; confuses holder if it dislikes spicy flavor.",
    },
  },
  {
    id: "wiki-berry",
    name: "Wiki Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Restores 1/8 max HP; confuses holder if it dislikes dry flavor.",
    },
  },
  {
    id: "mago-berry",
    name: "Mago Berry",
    gen: 2,
    category: {
      category: "berry",
      effect:
        "Restores 1/8 max HP; confuses holder if it dislikes sweet flavor.",
    },
  },
  {
    id: "aguav-berry",
    name: "Aguav Berry",
    gen: 2,
    category: {
      category: "berry",
      effect:
        "Restores 1/8 max HP; confuses holder if it dislikes bitter flavor.",
    },
  },
  {
    id: "iapapa-berry",
    name: "Iapapa Berry",
    gen: 2,
    category: {
      category: "berry",
      effect:
        "Restores 1/8 max HP; confuses holder if it dislikes sour flavor.",
    },
  },
  {
    id: "razz-berry",
    name: "Razz Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Makes wild Pokémon easier to catch (Pokéblock ingredient).",
    },
  },
  {
    id: "bluk-berry",
    name: "Bluk Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "No battle effect; used in Pokéblock making.",
    },
  },
  {
    id: "nanab-berry",
    name: "Nanab Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "No battle effect; used in Pokéblock making.",
    },
  },
  {
    id: "wepear-berry",
    name: "Wepear Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "No battle effect; used in Pokéblock making.",
    },
  },
  {
    id: "pinap-berry",
    name: "Pinap Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "No battle effect; used in Pokéblock making.",
    },
  },
  {
    id: "liechi-berry",
    name: "Liechi Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Raises Attack by 1 stage when HP drops to 25% or below.",
    },
  },
  {
    id: "ganlon-berry",
    name: "Ganlon Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Raises Defense by 1 stage when HP drops to 25% or below.",
    },
  },
  {
    id: "salac-berry",
    name: "Salac Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Raises Speed by 1 stage when HP drops to 25% or below.",
    },
  },
  {
    id: "petaya-berry",
    name: "Petaya Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Raises Special Attack by 1 stage when HP drops to 25% or below.",
    },
  },
  {
    id: "apicot-berry",
    name: "Apicot Berry",
    gen: 2,
    category: {
      category: "berry",
      effect:
        "Raises Special Defense by 1 stage when HP drops to 25% or below.",
    },
  },
  {
    id: "lansat-berry",
    name: "Lansat Berry",
    gen: 2,
    category: {
      category: "berry",
      effect:
        "Raises critical-hit ratio by 2 stages when HP drops to 25% or below.",
    },
  },
  {
    id: "starf-berry",
    name: "Starf Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Raises a random stat by 2 stages when HP drops to 25% or below.",
    },
  },
  {
    id: "enigma-berry",
    name: "Enigma Berry",
    gen: 2,
    category: {
      category: "berry",
      effect: "Restores 25% HP when hit by a super-effective move.",
    },
  },
  {
    id: "micle-berry",
    name: "Micle Berry",
    gen: 2,
    category: {
      category: "berry",
      effect:
        "Raises accuracy of next move by 20% when HP drops to 25% or below.",
    },
  },
  {
    id: "custap-berry",
    name: "Custap Berry",
    gen: 2,
    category: {
      category: "berry",
      effect:
        "Holder moves first on the next turn when HP drops to 25% or below.",
    },
  },
  {
    id: "jaboca-berry",
    name: "Jaboca Berry",
    gen: 2,
    category: {
      category: "berry",
      effect:
        "Damages attacker by 1/8 of their max HP if they use a physical move.",
    },
  },
  {
    id: "rowap-berry",
    name: "Rowap Berry",
    gen: 2,
    category: {
      category: "berry",
      effect:
        "Damages attacker by 1/8 of their max HP if they use a special move.",
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // MEGA EVOLUTION STONES
  // Introduced in Gen 6; compatible with Gen 1 & 2 Pokémon.
  // ══════════════════════════════════════════════════════════════════

  // ── Gen 1 Starters ────────────────────────────────────────────────
  // ── Gen 1 Starters ────────────────────────────────────────────────
  {
    id: "venusaurite",
    name: "Venusaurite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "venusaur",
      megaForm: "mega-venusaur",
      effect: "Allows Mega Evolution of Venusaur.",
    },
  },
  {
    id: "charizardite-x",
    name: "Charizardite X",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "charizard",
      megaForm: "mega-charizard-x",
      effect: "Allows Mega Evolution of Charizard into Mega Charizard X.",
    },
  },
  {
    id: "charizardite-y",
    name: "Charizardite Y",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "charizard",
      megaForm: "mega-charizard-y",
      effect: "Allows Mega Evolution of Charizard into Mega Charizard Y.",
    },
  },
  {
    id: "blastoisinite",
    name: "Blastoisinite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "blastoise",
      megaForm: "mega-blastoise",
      effect: "Allows Mega Evolution of Blastoise.",
    },
  },

  // ── Gen 1 Pokémon ─────────────────────────────────────────────────
  {
    id: "beedrillite",
    name: "Beedrillite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "beedrill",
      megaForm: "mega-beedrill",
      effect: "Allows Mega Evolution of Beedrill.",
    },
  },
  {
    id: "pidgeotite",
    name: "Pidgeotite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "pidgeot",
      megaForm: "mega-pidgeot",
      effect: "Allows Mega Evolution of Pidgeot.",
    },
  },
  {
    id: "alakazite",
    name: "Alakazite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "alakazam",
      megaForm: "mega-alakazam",
      effect: "Allows Mega Evolution of Alakazam.",
    },
  },
  {
    id: "slowbronite",
    name: "Slowbronite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "slowbro",
      megaForm: "mega-slowbro",
      effect: "Allows Mega Evolution of Slowbro.",
    },
  },
  {
    id: "gengarite",
    name: "Gengarite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "gengar",
      megaForm: "mega-gengar",
      effect: "Allows Mega Evolution of Gengar.",
    },
  },
  {
    id: "kangaskhanite",
    name: "Kangaskhanite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "kangaskhan",
      megaForm: "mega-kangaskhan",
      effect: "Allows Mega Evolution of Kangaskhan.",
    },
  },
  {
    id: "pinsirite",
    name: "Pinsirite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "pinsir",
      megaForm: "mega-pinsir",
      effect: "Allows Mega Evolution of Pinsir.",
    },
  },
  {
    id: "gyaradosite",
    name: "Gyaradosite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "gyarados",
      megaForm: "mega-gyarados",
      effect: "Allows Mega Evolution of Gyarados.",
    },
  },
  {
    id: "aerodactylite",
    name: "Aerodactylite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "aerodactyl",
      megaForm: "mega-aerodactyl",
      effect: "Allows Mega Evolution of Aerodactyl.",
    },
  },
  {
    id: "dragonitite",
    name: "Dragonitite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "dragonite",
      megaForm: "mega-dragonite",
      effect: "Allows Mega Evolution of Dragonite.",
    },
  },
  {
    id: "skarmorite",
    name: "Skarmorite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "skarmorite",
      megaForm: "mega-skarmorite",
      effect: "Allows Mega Evolution of Skarmory.",
    },
  },
  {
    id: "feraligatrite",
    name: "Feraligatrite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "feraligatrite",
      megaForm: "mega-feraligatr",
      effect: "Allows Mega Evolution of Feraligatrite.",
    },
  },
  {
    id: "mewtwonite-x",
    name: "Mewtwonite X",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "mewtwo",
      megaForm: "mega-mewtwo-x",
      effect: "Allows Mega Evolution of Mewtwo into Mega Mewtwo X.",
    },
  },
  {
    id: "mewtwonite-y",
    name: "Mewtwonite Y",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "mewtwo",
      megaForm: "mega-mewtwo-y",
      effect: "Allows Mega Evolution of Mewtwo into Mega Mewtwo Y.",
    },
  },

  // ── Gen 2 Pokémon ─────────────────────────────────────────────────
  {
    id: "ampharosite",
    name: "Ampharosite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "ampharos",
      megaForm: "mega-ampharos",
      effect: "Allows Mega Evolution of Ampharos.",
    },
  },
  {
    id: "steelixite",
    name: "Steelixite",
    gen: 7,
    category: {
      category: "mega-stone",
      megaOf: "steelix",
      megaForm: "mega-steelix",
      effect: "Allows Mega Evolution of Steelix.",
    },
  },
  {
    id: "scizorite",
    name: "Scizorite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "scizor",
      megaForm: "mega-scizor",
      effect: "Allows Mega Evolution of Scizor.",
    },
  },
  {
    id: "heracronite",
    name: "Heracronite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "heracross",
      megaForm: "mega-heracross",
      effect: "Allows Mega Evolution of Heracross.",
    },
  },
  {
    id: "houndoominite",
    name: "Houndoominite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "houndoom",
      megaForm: "mega-houndoom",
      effect: "Allows Mega Evolution of Houndoom.",
    },
  },
  {
    id: "tyranitarite",
    name: "Tyranitarite",
    gen: 6,
    category: {
      category: "mega-stone",
      megaOf: "tyranitar",
      megaForm: "mega-tyranitar",
      effect: "Allows Mega Evolution of Tyranitar.",
    },
  },
];
// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the item with the given ID, if it exists.
 *
 *   const item = getItem("fire-stone");
 */
export function getItem(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}

/**
 * Returns all items of a specific category.
 *
 *   const megaStones = getItemsByCategory("mega-stone");
 */
export function getItemsByCategory<C extends ItemCategory["category"]>(
  category: C,
): Item[] {
  return ITEMS.filter((i) => i.category.category === category);
}

/**
 * Returns all items introduced in a specific generation.
 *
 *   const gen2Items = getItemsByGen(2);
 */
export function getItemsByGen(gen: Item["gen"]): Item[] {
  return ITEMS.filter((i) => i.gen === gen);
}

/**
 * Returns the Mega Stone for a given Pokémon name, if one exists.
 * For Pokémon with multiple stones (e.g. Charizard, Mewtwo), returns all.
 *
 *   const stones = getMegaStones("charizard");
 *   // → [{ id: "charizardite-x", ... }, { id: "charizardite-y", ... }]
 */
export function getMegaStones(pokemonName: string): Item<MegaStoneCategory>[] {
  return ITEMS.filter(
    (i): i is Item<MegaStoneCategory> =>
      i.category.category === "mega-stone" &&
      (i.category as MegaStoneCategory).megaOf === pokemonName,
  );
}
