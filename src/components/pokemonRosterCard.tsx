import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Pokemon } from "../types/pokemon";

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

type Props = {
  pokemon: Pokemon;
  onPress?: () => void;
};

export default function PokemonRosterCard({ pokemon, onPress }: Props) {
  const primaryType = pokemon.type[0];
  const accentColor = TYPE_COLORS[primaryType] ?? "#888";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, { borderColor: accentColor + "55" }]}
    >
      {/* Glow background circle */}
      <View style={[styles.glow, { backgroundColor: accentColor + "22" }]} />

      {/* Type badges */}
      <View style={styles.typeBadges}>
        {pokemon.type.map((t) => (
          <View
            key={t}
            style={[
              styles.badge,
              { backgroundColor: (TYPE_COLORS[t] ?? "#888") + "33" },
            ]}
          >
            <Text
              style={[styles.badgeText, { color: TYPE_COLORS[t] ?? "#888" }]}
            >
              {t}
            </Text>
          </View>
        ))}
      </View>

      {/* Sprite — resizeMode contain prevents clipping */}
      <Image
        source={{ uri: pokemon.frontImage }}
        style={styles.sprite}
        resizeMode="contain"
      />

      <Text style={styles.name}>{pokemon.name}</Text>

      {/* HP Bar */}
      <View style={styles.hpBarBg}>
        <View
          style={[
            styles.hpBarFill,
            {
              width: `${(pokemon.hp / pokemon.maxHp) * 100}%` as any,
              backgroundColor: accentColor,
            },
          ]}
        />
      </View>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: "row",
          width: "80%",
          marginTop: 10,
        }}
      >
        <Text style={styles.hpText}>
          HP {pokemon.hp}/{pokemon.maxHp}
        </Text>

        <Text style={styles.level}>Lv. {pokemon.level}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  glow: {
    position: "absolute",
    width: 130,
    height: 90,
    borderRadius: 10,
    top: "20%",
    alignSelf: "center",
  },
  typeBadges: {
    flexDirection: "row",
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  sprite: {
    width: 90,
    height: 90,
  },
  name: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "capitalize",
    marginTop: 4,
    textAlign: "center",
  },
  hpBarBg: {
    width: "90%",
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#ffffff7d",
    marginTop: 8,
    overflow: "hidden",
  },
  hpBarFill: {
    height: 6,
    borderRadius: 2,
  },
  hpText: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 3,
  },
  level: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
  },
});
