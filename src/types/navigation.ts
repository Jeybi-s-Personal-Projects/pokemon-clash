import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Area, Region } from "../encounter/batchGenerator";
import { Pokemon } from "./pokemon";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined;
  SelectPokemon: { team: Pokemon[] };
  Battle: {
    player: Pokemon;
    team?: Pokemon[];
    enemy: Pokemon;
    onRun?: () => void;
    onSave?: () => void;
    catchResult?: {
      caught: boolean;
      caughtPokemon: { id: string } & Pokemon;
      teamFull: boolean;
    };
    catchPending?: {
      item: { id: string; name: string; catchRate: number };
    };
  };
  RegionSelect: { team: Pokemon[] };
  AreaSelect: { region: Region; team: Pokemon[] };
  EncounterFlow: {
    region: Region;
    area: Area;
    team: Pokemon[];
    catchResult?: {
      caught: boolean;
      caughtPokemon: { id: string } & Pokemon;
      teamFull: boolean;
    };
    catchPending?: {
      item: { id: string; name: string; catchRate: number };
    };
  };
  PokemonList: {
    mode?: "view" | "explore";
    region?: Region;
    area?: Area;
  };
  PokemonStats: { pokemon: Pokemon; onRelease?: () => void };
  PokemonTeam: { initialTeam: Pokemon[]; onSave?: () => void };
  SelectFromPC: { currentTeamIds: string[] };
  InventoryBag: {
    player: Pokemon;
    team?: Pokemon[];
    pokemon: Pokemon;
    fromScreen: "Battle" | "EncounterFlow";
  };
  CatchingScreen: {
    player: Pokemon;
    team?: Pokemon[];
    enemy: Pokemon;
    item: { id: string; name: string; catchRate: number };
    fromScreen: "Battle" | "EncounterFlow";
  };
};

export type CatchingScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CatchingScreen"
>;

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
