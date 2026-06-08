import { useEffect, useState } from "react";
import { Image, View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/auth-context";
import { apiGetLeaderboard, type LeaderboardEntry } from "../../lib/api";
import { T } from "../../lib/theme";
import { getAvatarImage } from "../../lib/avatar";

const RANK_COLORS: Record<string, string> = {
  "Mrežni Čuvar": T.primary,
  "Specijalista":  "#8B5CF6",
  "Agent":         T.good,
  "Analitičar":    T.sun,
  "Pripravnik":    T.hudMuted,
};
const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardScreen() {
  const { user }   = useAuth();
  const insets     = useSafeAreaInsets();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    apiGetLeaderboard()
      .then(setEntries)
      .catch(() => setError("Nije moguće učitati rang listu."))
      .finally(() => setLoading(false));
  }, []);

  const myRank = entries.findIndex((e) => e.id === user?.id) + 1;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <LinearGradient
        colors={[T.scene1, T.scene2, T.bg]}
        locations={[0, 0.35, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200 }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20, paddingHorizontal: 16 }}
      >
        {/* Header */}
        <Text style={{ fontFamily: T.fontBody, color: T.sun, fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>Globalno</Text>
        <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 28, marginTop: 4 }}>Rang Lista</Text>
        <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14, marginTop: 4, marginBottom: 20 }}>
          {myRank > 0 ? `Tvoje mjesto: #${myRank}` : "Nisi još na listi"}
        </Text>

        {error ? (
          <View style={{ backgroundColor: T.badSoft, borderColor: T.bad, borderWidth: 1, borderRadius: T.rMd, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontFamily: T.fontBody, color: T.badInk }}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={T.teal} />
        ) : (
          <View style={{ gap: 8 }}>
            {entries.map((entry) => {
              const isMe      = entry.id === user?.id;
              const rankColor = RANK_COLORS[entry.rankTier] ?? T.hudMuted;
              const avatar    = getAvatarImage(entry.avatarBase);
              const avatarClr = entry.avatarColor ?? T.primary;

              return (
                <View
                  key={entry.id}
                  style={{
                    backgroundColor: isMe ? "rgba(24,165,130,0.08)" : T.panel,
                    borderColor: isMe ? "rgba(24,165,130,0.4)" : T.border,
                    borderWidth: isMe ? 2 : 1,
                    borderRadius: T.rMd, padding: 14,
                    flexDirection: "row", alignItems: "center", gap: 12,
                  }}
                >
                  {/* Rank */}
                  <View style={{ width: 36, alignItems: "center" }}>
                    {MEDAL[entry.rank] ? (
                      <Text style={{ fontSize: 22 }}>{MEDAL[entry.rank]}</Text>
                    ) : (
                      <Text style={{ fontFamily: T.fontBodyXBold, color: T.hudMuted, fontSize: 15 }}>#{entry.rank}</Text>
                    )}
                  </View>

                  {/* Avatar */}
                  <View style={{
                    width: 42, height: 42, borderRadius: 21,
                    backgroundColor: `${avatarClr}22`,
                    borderWidth: 2, borderColor: avatarClr,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Image source={avatar} style={{ width: 24, height: 34, resizeMode: "contain" }} />
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: T.fontHead, color: isMe ? T.teal : T.hudInk, fontSize: 15 }}>
                      {entry.codename ?? entry.username}{isMe ? " (ti)" : ""}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <Text style={{ fontFamily: T.fontBody, color: rankColor, fontSize: 11 }}>{entry.rankTier}</Text>
                      <Text style={{ color: T.border }}>·</Text>
                      <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11 }}>Lv {entry.level}</Text>
                    </View>
                  </View>

                  {/* XP */}
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: T.fontBodyXBold, color: T.sun, fontSize: 15 }}>
                      {entry.points.toLocaleString()}
                    </Text>
                    <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11 }}>XP</Text>
                  </View>
                </View>
              );
            })}

            {entries.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>🏆</Text>
                <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 16 }}>Rang lista je prazna</Text>
                <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 13, marginTop: 4, textAlign: "center" }}>
                  Završi prvu misiju da se pojaviš ovdje!
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
