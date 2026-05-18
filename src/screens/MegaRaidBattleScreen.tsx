import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { Item, MegaStoneCategory } from "../data/items/items";
import { useInventory } from "../hooks/useInventory";
import { getPokemon } from "../hooks/usePokemon";
import { useTeam } from "../hooks/useTeam";
import { colors } from "../theme/color";
import { MegaRaidBattleScreenProps } from "../types/navigation";
import { Pokemon } from "../types/pokemon";
import { Battle } from "./BattleScreen";

export default function MegaRaidBattleScreen({
  navigation,
  route,
}: MegaRaidBattleScreenProps) {
  const megaStone = route.params.megaStone as Item<MegaStoneCategory>;
  const { user } = useAuth();
  const userId = user?.id || "";
  const { team, loading: teamLoading } = useTeam(userId);
  const { addItem } = useInventory(userId);
  const [enemyPokemon, setEnemyPokemon] = useState<Pokemon | null>(null);

  useEffect(() => {
    const initRaid = async () => {
      const megaOf = megaStone.category.megaOf;
      if (!megaOf) return;

      const megaPokemon = await getPokemon(megaOf, 60);

      setEnemyPokemon({
        ...megaPokemon,
        name: `Mega ${megaOf.toUpperCase()}`,
        level: 60,
        hp: megaPokemon.maxHp,
        maxHp: megaPokemon.maxHp,
      });
    };
    initRaid();
  }, [megaStone]);

  if (!enemyPokemon || teamLoading || team.length === 0) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: "white" }}>Preparing Mega Raid...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Battle
        player={team[0]} // Use active Pokémon
        team={team}
        enemy={enemyPokemon}
        onBattleEnd={(winner, updatedTeam) => {
          if (winner === "player") {
            addItem(megaStone.id, 1);
            Alert.alert("Victory!", `You obtained the ${megaStone.name}!`);
            navigation.goBack();
          } else {
            navigation.goBack();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.modalBackground,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.modalBackground,
    justifyContent: "center",
    alignItems: "center",
  },
});
