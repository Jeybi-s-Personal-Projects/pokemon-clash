import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Pokemon } from "../types/pokemon";

type Props = {
  userName: string;
  team: Pokemon[];
  onLogout: () => void;
  onRefresh: () => void;
  onEditTeam: () => void;
  onViewList: () => void;
};

export default function DashboardHeader({
  userName,
  team,
  onLogout,
  onRefresh,
  onEditTeam,
  onViewList,
}: Props) {
  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.username}>
            {userName} <Text style={{ color: "#818CF8" }}>✦</Text>
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
            Ready for your next battle?
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.trainerBadge}>
            <Ionicons name="ribbon" size={14} color="#818CF8" />
            <Text style={styles.trainerBadgeText}>Elite Trainer</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsBar}>
        <StatItem
          icon="account-group"
          label="Team"
          value={`${team.length}/6`}
          color="#818CF8"
        />
        <View style={styles.statDivider} />
        <StatItem
          icon="trending-up"
          label="Top Lv."
          value={team.length > 0 ? Math.max(...team.map((p) => p.level)) : 0}
          color="#34d399"
        />
        <View style={styles.statDivider} />
        <StatItem
          icon="shape-outline"
          label="Types"
          value={[...new Set(team.flatMap((p) => p.type))].length}
          color="#fbbf24"
        />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Pokémon Team</Text>
          <Text style={styles.sectionSub}>Manage your active party</Text>
        </View>

        <View style={styles.headerActions}>
          <IconButton icon="refresh" color="#9CA3AF" onPress={onRefresh} />
          <IconButton icon="pencil" color="#818CF8" onPress={onEditTeam} />
          <IconButton icon="view-grid" color="#34d399" onPress={onViewList} />
        </View>
      </View>
    </>
  );
}

function IconButton({
  icon,
  onPress,
  color,
}: {
  icon: any;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.iconButton}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </TouchableOpacity>
  );
}

function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      <Text style={{ fontSize: 18, fontWeight: "700", color, marginTop: 4 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: "#6B7280" }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: "#030712",
  },
  greeting: { fontSize: 13, color: "#6B7280", letterSpacing: 0.5 },
  username: { fontSize: 24, fontWeight: "800", color: "#F9FAFB" },
  trainerBadge: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trainerBadgeText: { color: "#D1D5DB", fontSize: 13 },
  logoutButton: {
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#111827",
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  statDivider: { width: 1, height: 30, backgroundColor: "#1F2937" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#F9FAFB" },
  sectionSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
