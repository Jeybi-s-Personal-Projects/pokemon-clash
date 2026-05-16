import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Pokemon } from "../types/pokemon";
import { TypeBadge } from "./TypeBadge";
import { TYPE_COLORS } from "./TypeBadge";

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
      style={[styles.card, { borderColor: accentColor + "95" }]}
    >
      {/* Glow background circle */}
      <View style={[styles.glow, { backgroundColor: accentColor + "22" }]} />

      <View
        style={{
          opacity: 0.2,
          width: 80,
          height: 80,
          position: "absolute",
          top: "20%",
        }}
      >
        <MaterialCommunityIcons name="pokeball" size={80} color="#9aa4b2" />
      </View>

      {/* Type badges */}
      <View style={styles.typeBadges}>
        {pokemon.type.map((t) => (
          <TypeBadge key={t} type={t} />
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
          marginTop: 6,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            gap: 2,
            justifyContent: "flex-start",
            alignContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name="heart-outline"
            size={12}
            color="#a81b1b"
          />
          <Text style={styles.hpText}>
            HP {pokemon.hp}/{pokemon.maxHp}
          </Text>
        </View>

        <Text style={styles.level}>Lv. {pokemon.level}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160, // Added a specific width
    height: 200,
    backgroundColor: "#111827",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 8,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  glow: {
    position: "absolute",
    width: "90%",
    height: 90,
    borderRadius: 10,
    top: "20%",
    alignSelf: "center",
  },
  typeBadges: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "center",
  },
  sprite: {
    width: 100,
    height: 100,
  },
  name: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
    textTransform: "capitalize",
    textAlign: "center",
  },
  hpBarBg: {
    marginTop: 5,
    width: "90%",
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#ffffff7d",
    overflow: "hidden",
  },
  hpBarFill: {
    height: 6,
    borderRadius: 2,
  },
  hpText: {
    color: "#9CA3AF",
    fontSize: 10,
  },
  level: {
    color: "#6B7280",
    fontSize: 11,
  },
});
