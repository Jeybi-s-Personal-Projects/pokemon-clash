import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { gen1Pokemon } from "../data/gen1Pokemon";
import { gen2Pokemon } from "../data/gen2Pokemon";
import { usePokemonList } from "../hooks/usePokemonList";
import { colors } from "../theme/color";

const clickSound = require("../../assets/sounds/buttonClick.mp3");

const ALL_TYPES = [
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "ice",
  "dragon",
  "dark",
  "fairy",
  "normal",
  "fighting",
  "flying",
  "poison",
  "ground",
  "rock",
  "bug",
  "ghost",
  "steel",
];

const REGIONS = [
  "Kanto",
  "Johto",
  "Hoenn",
  "Sinnoh",
  "Unova",
  "Kalos",
  "Alola",
  "Galar",
  "Paldea",
];

const REGION_DATA: Record<string, any[]> = {
  Kanto: gen1Pokemon,
  Johto: gen2Pokemon,
};

const TYPE_COLORS: Record<string, string> = {
  fire: "#FF6B35",
  water: "#4FC3F7",
  grass: "#66BB6A",
  electric: "#FFD54F",
  psychic: "#F48FB1",
  ice: "#80DEEA",
  dragon: "#7986CB",
  dark: "#616161",
  fairy: "#F06292",
  normal: "#BDBDBD",
  fighting: "#EF5350",
  flying: "#90CAF9",
  poison: "#AB47BC",
  ground: "#D4A574",
  rock: "#8D6E63",
  bug: "#AED581",
  ghost: "#7E57C2",
  steel: "#78909C",
};

type OwnershipFilter = "all" | "owned" | "unowned";

export default function PokemonListScreen({ navigation }: any) {
  const { user } = useAuth();
  const { pokemon: ownedPokemon, loading } = usePokemonList(user?.id ?? "");

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("Kanto");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [ownershipDropdownOpen, setOwnershipDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("all");

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  // Merged selected region list with owned status
  const mergedList = useMemo(() => {
    const regionList = REGION_DATA[selectedRegion] ?? [];
    return regionList.map((p) => {
      const ownedInstance = ownedPokemon.find(
        (op) => op.pk_name.toLowerCase() === p.name.toLowerCase(),
      );
      return {
        ...p,
        owned: !!ownedInstance,
        instance: ownedInstance,
      };
    });
  }, [ownedPokemon, selectedRegion]);

  const filtered = useMemo(() => {
    return mergedList.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = selectedType ? p.types.includes(selectedType) : true;
      const matchesOwnership =
        ownershipFilter === "owned"
          ? p.owned
          : ownershipFilter === "unowned"
            ? !p.owned
            : true;
      return matchesSearch && matchesType && matchesOwnership;
    });
  }, [mergedList, search, selectedType, ownershipFilter]);

  const ownershipLabel = {
    all: "All",
    owned: "Owned",
    unowned: "Unowned",
  }[ownershipFilter];

  const handleNextPage = () => {
    playClick();
    const currentIndex = REGIONS.indexOf(selectedRegion);
    if (currentIndex < REGIONS.length - 1) {
      setSelectedRegion(REGIONS[currentIndex + 1]);
    }
  };

  const handlePrevPage = () => {
    playClick();
    const currentIndex = REGIONS.indexOf(selectedRegion);
    if (currentIndex > 0) {
      setSelectedRegion(REGIONS[currentIndex - 1]);
    }
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Search + Dropdowns Row */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Pokémon..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={(t: string) => {
            setSearch(t);
            setTypeDropdownOpen(false);
            setOwnershipDropdownOpen(false);
            setRegionDropdownOpen(false);
          }}
        />

        {/* Type Filter */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedType && { borderColor: TYPE_COLORS[selectedType] },
          ]}
          onPress={() => {
            playClick();
            setTypeDropdownOpen(!typeDropdownOpen);
            setOwnershipDropdownOpen(false);
            setRegionDropdownOpen(false);
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedType && { color: TYPE_COLORS[selectedType] },
            ]}
          >
            {selectedType ?? "Type"} ▾
          </Text>
        </TouchableOpacity>

        {/* Ownership Filter */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            ownershipFilter !== "all" && { borderColor: colors.accent },
          ]}
          onPress={() => {
            playClick();
            setOwnershipDropdownOpen(!ownershipDropdownOpen);
            setTypeDropdownOpen(false);
            setRegionDropdownOpen(false);
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              ownershipFilter !== "all" && { color: colors.accent },
            ]}
          >
            {ownershipLabel} ▾
          </Text>
        </TouchableOpacity>
      </View>

      {/* Region Selector Row - NOW BELOW SEARCH */}
      <View style={styles.regionRow}>
        <TouchableOpacity
          style={styles.regionFilterButton}
          onPress={() => {
            playClick();
            setRegionDropdownOpen(!regionDropdownOpen);
            setTypeDropdownOpen(false);
            setOwnershipDropdownOpen(false);
          }}
        >
          <Text style={styles.regionFilterButtonText}>
            Region: {selectedRegion} ▾
          </Text>
        </TouchableOpacity>
      </View>

      {/* Region Dropdown */}
      {regionDropdownOpen && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {REGIONS.map((region) => (
              <TouchableOpacity
                key={region}
                style={styles.dropdownItem}
                onPress={() => {
                  playClick();
                  setSelectedRegion(region);
                  setRegionDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedRegion === region && {
                      color: colors.accent,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Type Dropdown */}
      {typeDropdownOpen && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                playClick();
                setSelectedType(null);
                setTypeDropdownOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  !selectedType && { color: colors.accent, fontWeight: "bold" },
                ]}
              >
                All Types
              </Text>
            </TouchableOpacity>
            {ALL_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.dropdownItem}
                onPress={() => {
                  playClick();
                  setSelectedType(type);
                  setTypeDropdownOpen(false);
                }}
              >
                <View
                  style={[
                    styles.typeColorDot,
                    { backgroundColor: TYPE_COLORS[type] },
                  ]}
                />
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedType === type && {
                      color: TYPE_COLORS[type],
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Ownership Dropdown */}
      {ownershipDropdownOpen && (
        <View style={styles.dropdown}>
          {(["all", "owned", "unowned"] as OwnershipFilter[]).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.dropdownItem}
              onPress={() => {
                playClick();
                setOwnershipFilter(opt);
                setOwnershipDropdownOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  ownershipFilter === opt && {
                    color: colors.accent,
                    fontWeight: "bold",
                  },
                ]}
              >
                {opt === "all"
                  ? "All"
                  : opt === "owned"
                    ? "✓ Owned"
                    : "✗ Unowned"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Count */}
      <Text style={styles.countText}>{filtered.length} Pokémon</Text>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>
            {REGION_DATA[selectedRegion]
              ? "No Pokémon found"
              : "Region data coming soon!"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {REGION_DATA[selectedRegion]
              ? "Try a different search or filter"
              : `We are still gathering data for ${selectedRegion}`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View style={[styles.card, item.owned && styles.cardOwned]}>
              <View style={styles.typeBadges}>
                {item.types.map((t: string) => (
                  <View
                    key={t}
                    style={[
                      styles.badge,
                      { backgroundColor: (TYPE_COLORS[t] ?? "#888") + "33" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: TYPE_COLORS[t] ?? "#888" },
                      ]}
                    >
                      {t}
                    </Text>
                  </View>
                ))}
              </View>

              <Image
                source={{
                  uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${item.id}.gif`,
                }}
                style={[styles.sprite, !item.owned && styles.spriteUnowned]}
                resizeMode="contain"
              />
              <Text style={styles.pokeName}>{item.name}</Text>

              {item.owned ? (
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedBadgeText}>✓ Owned</Text>
                </View>
              ) : (
                <Text style={styles.unownedText}>Not owned</Text>
              )}
            </View>
          )}
          ListFooterComponent={
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  REGIONS.indexOf(selectedRegion) === 0 &&
                    styles.disabledButton,
                ]}
                onPress={handlePrevPage}
                disabled={REGIONS.indexOf(selectedRegion) === 0}
              >
                <Text style={styles.pageButtonText}>← Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  REGIONS.indexOf(selectedRegion) === REGIONS.length - 1 &&
                    styles.disabledButton,
                ]}
                onPress={handleNextPage}
                disabled={
                  REGIONS.indexOf(selectedRegion) === REGIONS.length - 1
                }
              >
                <Text style={styles.pageButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            playClick();
            navigation.navigate("SelectPokemon", { team: ownedPokemon });
          }}
        >
          <Text style={styles.addButtonText}>+ Add Pokémon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.modalBackground },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.modalBackground,
  },

  regionRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  regionFilterButton: {
    backgroundColor: colors.modalContent,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  regionFilterButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "bold",
  },

  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.modalContent,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15,
  },
  filterButton: {
    backgroundColor: colors.modalContent,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: "center",
  },
  filterButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "capitalize",
  },

  dropdown: {
    marginHorizontal: 16,
    backgroundColor: colors.modalContent,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 8,
    zIndex: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    color: colors.textPrimary,
    fontSize: 14,
    textTransform: "capitalize",
  },
  typeColorDot: { width: 10, height: 10, borderRadius: 5 },

  countText: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    color: colors.textMuted,
    fontSize: 12,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  card: {
    flex: 1,
    backgroundColor: colors.modalContent,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: "center",
  },
  cardOwned: {
    borderColor: colors.accent + "88",
  },
  typeBadges: {
    flexDirection: "row",
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: "bold", textTransform: "uppercase" },
  sprite: { width: 90, height: 90 },
  spriteUnowned: { opacity: 0.25 },
  pokeName: {
    color: colors.textPrimary,
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "capitalize",
    marginTop: 4,
  },
  ownedBadge: {
    backgroundColor: colors.accent + "33",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  ownedBadgeText: { color: colors.accent, fontSize: 10, fontWeight: "bold" },
  unownedText: { color: colors.textMuted, fontSize: 10, marginTop: 4 },

  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 10,
    gap: 12,
  },
  pageButton: {
    flex: 1,
    backgroundColor: colors.modalContent,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  pageButtonText: {
    color: colors.accent,
    fontWeight: "bold",
  },
  disabledButton: {
    borderColor: colors.border,
    opacity: 0.5,
  },

  bottomContainer: {
    padding: 16,
    paddingBottom: 70,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.modalBackground,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  addButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
