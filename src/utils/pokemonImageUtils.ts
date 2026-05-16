/**
 * Returns the URL for a Pokemon's icon (Gen VIII style).
 * Useful for lists, modals, and small UI elements.
 */
export const getPokemonIcon = (id: number | string, isShiny?: boolean): string => {
  const baseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown";
  return isShiny 
    ? `${baseUrl}/shiny/${id}.gif`
    : `${baseUrl}/${id}.gif`;
};
