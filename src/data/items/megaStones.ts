import { ITEMS, Item, MegaStoneCategory } from "./items";

export const MEGA_STONES = ITEMS.filter(
  (i): i is Item<MegaStoneCategory> => i.category.category === "mega-stone",
);
