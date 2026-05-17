import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";

import AreaSelectScreen from "@/src/screens/AreaSelectScreen";
import BattleScreen from "@/src/screens/BattleScreen";
import CatchingScreen from "@/src/screens/CatchingScreen";
import DashboardScreen from "@/src/screens/DashboardScreen";
import { EncounterFlow } from "@/src/screens/EncounterFlow";
import InventoryBagScreen from "@/src/screens/inventoryBagScreen";
import LoginScreen from "@/src/screens/LoginScreen";
import PokemonListScreen from "@/src/screens/PokemonListScreen";
import PokemonStatsScreen from "@/src/screens/PokemonStatsScreen";
import PokemonTeamScreen from "@/src/screens/PokemonTeamScreen";
import PokemartScreen from "@/src/screens/PokemartScreen";
import RegionSelectScreen from "@/src/screens/RegionSelectScreen";
import SelectFromPCScreen from "@/src/screens/SelectFromPCScreen";
import SelectPokemonScreen from "@/src/screens/SelectPokemonScreen";
import SelectStarterScreen from "@/src/screens/selectStarterScreen";
import SignupScreen from "@/src/screens/SignupScreen";
import { RootStackParamList } from "../types/navigation"; // adjust path as needed

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!user ? (
        // Auth Flow
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // App Flow
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="SelectPokemon" component={SelectPokemonScreen} />
          <Stack.Screen
            name="Battle"
            component={BattleScreen}
            options={{
              title: "BATTLE",
              headerStyle: { backgroundColor: "#111827" },
              headerTintColor: "#F9FAFB",
              headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
            }}
          />
          <Stack.Screen
            name="PokemonList"
            options={{
              title: "My Pokemon",
              headerStyle: { backgroundColor: "#111827" },
              headerTintColor: "#F9FAFB",
              headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
            }}
            component={PokemonListScreen}
          />
          <Stack.Screen
            name="PokemonStats"
            options={{
              title: "Pokemon Stats",
              headerStyle: { backgroundColor: "#111827" },
              headerTintColor: "#F9FAFB",
              headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
            }}
            component={PokemonStatsScreen}
          />
          <Stack.Screen
            name="PokemonTeam"
            options={{
              title: "Manage Team",
              headerStyle: { backgroundColor: "#111827" },
              headerTintColor: "#F9FAFB",
              headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
            }}
            component={PokemonTeamScreen}
          />
          <Stack.Screen
            name="SelectStarter"
            options={{
              title: "Pick Your Starter",
              headerStyle: { backgroundColor: "#111827" },
              headerTintColor: "#F9FAFB",
              headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
            }}
            component={SelectStarterScreen}
          />
          <Stack.Screen
            name="SelectFromPC"
            options={{
              title: "PC Selection",
              headerStyle: { backgroundColor: "#111827" },
              headerTintColor: "#F9FAFB",
              headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
            }}
            component={SelectFromPCScreen}
          />
          <Stack.Screen
            name="EncounterFlow"
            component={EncounterFlow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegionSelect"
            component={RegionSelectScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AreaSelect"
            component={AreaSelectScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="InventoryBag"
            component={InventoryBagScreen}
            options={{
              title: "BAG",
              headerStyle: { backgroundColor: "#111827" },
              headerTintColor: "#F9FAFB",
              headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
            }}
          />
          <Stack.Screen
            name="CatchingScreen"
            component={CatchingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Pokemart"
            component={PokemartScreen}
            options={{
              title: "POKÉMART",
              headerStyle: { backgroundColor: "#111827" },
              headerTintColor: "#F9FAFB",
              headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
