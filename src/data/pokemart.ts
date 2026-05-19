export type MartItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: "pokeball" | "medicine" | "other";
};

export const MART_ITEMS: MartItem[] = [
  {
    id: "poke-ball",
    name: "Poké Ball",
    price: 200,
    description:
      "A device for catching wild Pokémon. It's thrown like a ball at a Pokémon, comfortably encapsulating its target.",
    category: "pokeball",
  },
  {
    id: "great-ball",
    name: "Great Ball",
    price: 600,
    description:
      "A good, high-performance Poké Ball that provides a higher Pokémon catch rate than a standard Poké Ball.",
    category: "pokeball",
  },
  {
    id: "ultra-ball",
    name: "Ultra Ball",
    price: 1200,
    description:
      "An ultra-high-performance Poké Ball that provides a higher Pokémon catch rate than a Great Ball.",
    category: "pokeball",
  },
  {
    id: "potion",
    name: "Potion",
    price: 300,
    description:
      "A spray-type medicine for treating wounds. It can be used to restore 20 HP to a single Pokémon.",
    category: "medicine",
  },
  {
    id: "super-potion",
    name: "Super Potion",
    price: 700,
    description:
      "A spray-type medicine for treating wounds. It can be used to restore 50 HP to a single Pokémon.",
    category: "medicine",
  },
  {
    id: "hyper-potion",
    name: "Hyper Potion",
    price: 1200,
    description:
      "A spray-type medicine for treating wounds. It can be used to restore 200 HP to a single Pokémon.",
    category: "medicine",
  },
  {
    id: "revive",
    name: "Revive",
    price: 1500,
    description:
      "A medicine that can be used to revive a Pokémon that has fainted. It also restores half the Pokémon's maximum HP.",
    category: "medicine",
  },
  {
    id: "tera-orb",
    name: "Tera Orb",
    price: 5000,
    description:
      "An orb that allows a Pokémon to Terastalize during battle. Can only be used once per battle.",
    category: "other",
  },
];
