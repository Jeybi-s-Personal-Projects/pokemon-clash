export interface Item {
  id: string;
  name: string;
  description: string;
}

export const ITEMS: Record<string, Item> = {
  leftovers: {
    id: "leftovers",
    name: "Leftovers",
    description: "Gradually restores HP in battle.",
  },
  "sitrus-berry": {
    id: "sitrus-berry",
    name: "Sitrus Berry",
    description: "Restores HP when health is low.",
  },
  "life-orb": {
    id: "life-orb",
    name: "Life Orb",
    description: "Boosts move damage but consumes HP.",
  },
  "choice-band": {
    id: "choice-band",
    name: "Choice Band",
    description: "Boosts Attack but locks move selection.",
  },
  everstone: {
    id: "everstone",
    name: "Everstone",
    description: "Prevents evolution.",
  },
};
