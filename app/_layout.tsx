import { initDb } from "@/src/lib/pokemonDb";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { AuthProvider } from "../src/context/AuthContext";

export default function RootLayout() {
  useEffect(() => {
    initDb().catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
