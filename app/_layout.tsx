import { Slot } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import { useEffect } from "react";
import { initDatabase } from "../src/lib/db";

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
