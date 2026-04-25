import { initDb } from "@/src/lib/pokemonDb";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthProvider } from "../src/context/AuthContext";

async function purgeStaleRows() {
  const db = await initDb();
  await db.execAsync(`
    DELETE FROM species_cache
    WHERE abilities IS NULL OR height_m IS NULL OR weight_kg IS NULL;
  `);
  console.log("[Dev] Stale rows purged");
}

export default function RootLayout() {
  useEffect(() => {
    initDb().catch(console.error);
  }, []);

  return (
    <AuthProvider>
      {__DEV__ && (
        <View style={styles.devBar}>
          <TouchableOpacity style={styles.btn} onPress={purgeStaleRows}>
            <Text style={styles.btnText}>🗑️ Purge Stale DB</Text>
          </TouchableOpacity>
        </View>
      )}
      <Slot />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  devBar: {
    position: "absolute",
    bottom: 40,
    right: 12,
    zIndex: 9999,
  },
  btn: {
    backgroundColor: "#e11d48",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
