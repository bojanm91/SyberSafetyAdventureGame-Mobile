import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/auth-context";
import { apiGetLeaderboard, type LeaderboardEntry } from "../../lib/api";

const RANK_COLORS: Record<string, string> = {
  "Mrežni Čuvar": "#22D3EE",
  "Specijalista": "#8B5CF6",
  "Agent": "#34D399",
  "Analitičar": "#FBBF24",
  "Pripravnik": "#8A97AD",
};

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const AVATAR_CHARS = { A: "⚡", B: "🛡️", C: "🔍", D: "🎯" };

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGetLeaderboard()
      .then(setEntries)
      .catch(() => setError("Nije moguće učitati rang listu."))
      .finally(() => setLoading(false));
  }, []);

  const myRank = entries.findIndex((e) => e.id === user?.id) + 1;

  return (
    <ScrollView
      style={{ backgroundColor: "#0B0F1A", flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20, paddingHorizontal: 16 }}
    >
      {/* Header */}
      <Text className="text-cyan/75 text-xs uppercase tracking-widest">Globalno</Text>
      <Text className="text-white text-3xl font-bold mt-1">Rang Lista</Text>
      <Text className="text-textMuted text-sm mt-1 mb-6">
        {myRank > 0 ? `Tvoje mjesto: #${myRank}` : "Nisi još na listi"}
      </Text>

      {error ? (
        <View style={{ backgroundColor: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.2)", borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "#F87171" }}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color="#22D3EE" />
      ) : (
        <View style={{ gap: 8 }}>
          {entries.map((entry) => {
            const isMe = entry.id === user?.id;
            const rankColor = RANK_COLORS[entry.rankTier] ?? "#8A97AD";
            const avatar = AVATAR_CHARS[(entry.avatarBase ?? "A") as keyof typeof AVATAR_CHARS] ?? "⚡";

            return (
              <View
                key={entry.id}
                style={{
                  backgroundColor: isMe ? "rgba(34,211,238,0.08)" : "#141A2A",
                  borderColor: isMe ? "rgba(34,211,238,0.35)" : "#26304A",
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {/* Rank */}
                <View style={{ width: 36, alignItems: "center" }}>
                  {MEDAL[entry.rank] ? (
                    <Text style={{ fontSize: 22 }}>{MEDAL[entry.rank]}</Text>
                  ) : (
                    <Text style={{ color: "#8A97AD", fontSize: 15, fontWeight: "700" }}>#{entry.rank}</Text>
                  )}
                </View>

                {/* Avatar */}
                <View style={{
                  width: 42, height: 42, borderRadius: 21,
                  backgroundColor: entry.avatarColor ? `${entry.avatarColor}22` : "rgba(34,211,238,0.15)",
                  borderWidth: 1.5,
                  borderColor: entry.avatarColor ?? "#22D3EE",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 18 }}>{avatar}</Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: isMe ? "#22D3EE" : "#E5ECF5", fontWeight: "700", fontSize: 15 }}>
                    {entry.codename ?? entry.username}
                    {isMe ? " (ti)" : ""}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <Text style={{ color: rankColor, fontSize: 11, fontWeight: "600" }}>{entry.rankTier}</Text>
                    <Text style={{ color: "#26304A" }}>·</Text>
                    <Text style={{ color: "#8A97AD", fontSize: 11 }}>Lv {entry.level}</Text>
                  </View>
                </View>

                {/* XP */}
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: "#22D3EE", fontWeight: "700", fontSize: 15 }}>
                    {entry.points.toLocaleString()}
                  </Text>
                  <Text style={{ color: "#8A97AD", fontSize: 11 }}>XP</Text>
                </View>
              </View>
            );
          })}

          {entries.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🏆</Text>
              <Text style={{ color: "#E5ECF5", fontSize: 16, fontWeight: "600" }}>Rang lista je prazna</Text>
              <Text style={{ color: "#8A97AD", fontSize: 13, marginTop: 4, textAlign: "center" }}>
                Završi prvu misiju da se pojaviš ovdje!
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
