import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Area, Region } from "../encounter/batchGenerator";
import { Pokemon } from "./pokemon";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined;
  SelectPokemon: { team: Pokemon[] };
  Battle: { player: Pokemon; enemy: Pokemon };
  RegionSelect: { player: Pokemon };
  AreaSelect: { region: Region; player: Pokemon };
  EncounterFlow: {
    region: Region;
    area: Area;
    player: Pokemon;
    onExit: () => void;
  };
  PokemonList: {
    mode?: "view" | "explore";
    region?: Region;
    area?: Area;
  };
  PokemonStats: { pokemon: Pokemon };
  PokemonTeam: { initialTeam: Pokemon[]; onSave?: () => void };
  InventoryBag: { pokemon: Pokemon };
};

export type InventoryBagScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "InventoryBag"
>;

export type DashboardScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Dashboard"
>;
export type PokemonTeamScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PokemonTeam"
>;
export type PokemonStatsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PokemonStats"
>;
export type SelectPokemonScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SelectPokemon"
>;
export type BattleScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Battle"
>;
export type RegionSelectScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "RegionSelect"
>;
export type AreaSelectScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "AreaSelect"
>;
export type EncounterFlowProps = NativeStackScreenProps<
  RootStackParamList,
  "EncounterFlow"
>;
