import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/auth-context";
import {
  apiGetProgress, apiGetDailyChallenge, apiGetMastery,
  type ProgressData, type DailyChallenge,
} from "../../lib/api";
import LevelRing from "../../components/LevelRing";

const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1300, 1600, 1900, 2200];

function xpPercent(points: number, level: number): number {
  const lo = XP_THRESHOLDS[level - 1] ?? 0;
  const hi = XP_THRESHOLDS[level] ?? lo + 300;
  if (hi === lo) return 100;
  return Math.round(((points - lo) / (hi - lo)) * 100);
}

function xpToNext(points: number, level: number): number {
  const hi = XP_THRESHOLDS[level] ?? (XP_THRESHOLDS[level - 1] ?? 0) + 300;
  return Math.max(0, hi - points);
}

const TYPE_ICONS: Record<string, string> = {
  odluka: "🎯", phishing_inbox: "📧", lozinka: "⚒️",
  razvrstaj: "🔀", pravo_lazno: "🔍", razgovor: "💬",
  podesi: "⚙️", brzi_krug: "⚡",
};

const TOPIC_ICONS: Record<string, string> = {
  lozinke: "🔑", phishing: "📧", privatnost: "🛡️", malver: "☣️",
  "javni-wifi": "📶", dvofaktorska: "🔐", "socijalni-inzenjering": "🎭",
  prevare: "⚠️", azuriranja: "🔄", "sigurno-preuzimanje": "📥",
};

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [daily, setDaily] = useState<DailyChallenge | null | undefined>(undefined);
  const [mastery, setMastery] = useState<Record<string, number>>({});
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiGetProgress().then(setProgress).catch(() => setError("Nije moguće učitati profil.")),
      apiGetDailyChallenge().then((d) => setDaily(d)).catch(() => setDaily(null)),
      apiGetMastery().then(setMastery).catch(() => {}),
    ]).finally(() => setLoadingProgress(false));
  }, [user]);

  if (!user) return null;

  const level = progress?.profile.level ?? user.level;
  const points = progress?.profile.points ?? user.points;
  const streak = progress?.profile.streak ?? user.streak;
  const pct = progress?.stats.xpPercentage ?? xpPercent(points, level);
  const toNext = progress?.stats.xpToNextLevel ?? xpToNext(points, level);
  const status = progress?.profile.status ?? user.status;

  // Average mastery as "signal strength" gauge (0-100)
  const masteryValues = Object.values(mastery);
  const avgMastery = masteryValues.length > 0
    ? Math.round(masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length)
    : 0;

  // Weakest topic for recommendation
  const weakestEntry = Object.entries(mastery).sort((a, b) => a[1] - b[1])[0];

  const avatarEmoji = user.avatarBase === "B" ? "🦁" : user.avatarBase === "C" ? "🦊" : user.avatarBase === "D" ? "🐺" : "🛡️";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0B0F1A" }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24, paddingHorizontal: 16 }}
    >
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(34,211,238,0.15)", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 16 }}>⛨</Text>
          </View>
          <Text style={{ color: "#E5ECF5", fontWeight: "600", fontSize: 15 }}>CyberSafety</Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          style={{ borderWidth: 1, borderColor: "#26304A", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ color: "#8A97AD", fontSize: 12 }}>Odjavi se</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={{ backgroundColor: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.2)", borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 }}>
          <Text style={{ color: "#F87171", fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      {/* Hero section: LevelRing + greeting */}
      <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          {loadingProgress ? (
            <View style={{ width: 100, height: 100, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color="#22D3EE" />
            </View>
          ) : (
            <LevelRing level={level} xpPercent={pct} size={100} avatarEmoji={avatarEmoji} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(34,211,238,0.75)", fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>Agent</Text>
            <Text style={{ color: "#E5ECF5", fontSize: 22, fontWeight: "800", marginTop: 2 }}>
              {user.codename ?? user.username}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <View style={{ backgroundColor: "rgba(34,211,238,0.1)", borderColor: "rgba(34,211,238,0.25)", borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ color: "#22D3EE", fontSize: 11, fontWeight: "700" }}>{status}</Text>
              </View>
              {streak > 0 && (
                <View style={{ backgroundColor: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.25)", borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ color: "#FBBF24", fontSize: 11, fontWeight: "700" }}>🔥 {streak}d</Text>
                </View>
              )}
            </View>
            <View style={{ marginTop: 10, gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#8A97AD", fontSize: 11 }}>XP do narednog nivoa</Text>
                <Text style={{ color: "#E5ECF5", fontSize: 11, fontWeight: "600" }}>{pct}%</Text>
              </View>
              <View style={{ height: 4, backgroundColor: "#1C2436", borderRadius: 99, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${pct}%`, backgroundColor: "#22D3EE", borderRadius: 99 }} />
              </View>
              <Text style={{ color: "#8A97AD", fontSize: 10 }}>{toNext} XP do Level {level + 1}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Bodovi", value: points.toLocaleString() },
          { label: "Završene misije", value: `${progress?.stats.completedQuests ?? 0}/${progress?.stats.totalQuests ?? 0}` },
          { label: "Bedževi", value: progress?.stats.badgesCount ?? 0 },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 16, padding: 12, alignItems: "center" }}>
            <Text style={{ color: "#E5ECF5", fontSize: 16, fontWeight: "800" }}>{s.value}</Text>
            <Text style={{ color: "#8A97AD", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginTop: 3, textAlign: "center" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Signal gauge: average mastery */}
      <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: "rgba(34,211,238,0.75)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Status mreže</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ height: 10, backgroundColor: "#1C2436", borderRadius: 99, overflow: "hidden" }}>
              <View style={{
                height: "100%",
                width: `${avgMastery}%`,
                backgroundColor: avgMastery >= 70 ? "#34D399" : avgMastery >= 40 ? "#FBBF24" : "#F87171",
                borderRadius: 99,
              }} />
            </View>
            <Text style={{ color: "#8A97AD", fontSize: 11, marginTop: 6 }}>
              Prosječno savladavanje: {avgMastery}%
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 28 }}>{avgMastery >= 70 ? "🟢" : avgMastery >= 40 ? "🟡" : "🔴"}</Text>
            <Text style={{ color: "#8A97AD", fontSize: 10 }}>
              {avgMastery >= 70 ? "Sigurno" : avgMastery >= 40 ? "U razvoju" : "Ugroženo"}
            </Text>
          </View>
        </View>
        {masteryValues.length === 0 && (
          <Text style={{ color: "#8A97AD", fontSize: 12, marginTop: 6 }}>Završi misije da vidiš napredak po temama.</Text>
        )}
      </View>

      {/* Daily Challenge */}
      {daily !== undefined && (
        <TouchableOpacity
          onPress={() => daily && router.push(`/game/${daily.id}`)}
          disabled={!daily}
          style={{
            backgroundColor: "#141A2A", borderWidth: 1.5,
            borderColor: daily ? "rgba(251,191,36,0.4)" : "#26304A",
            borderRadius: 20, padding: 16, marginBottom: 16,
            opacity: daily ? 1 : 0.6,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 20 }}>☀️</Text>
            <Text style={{ color: "#FBBF24", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700" }}>Dnevni izazov</Text>
          </View>
          {daily ? (
            <>
              <Text style={{ color: "#E5ECF5", fontSize: 16, fontWeight: "700", lineHeight: 22 }}>{daily.title}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" }}>
                <View style={{ backgroundColor: "rgba(251,191,36,0.15)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(251,191,36,0.3)" }}>
                  <Text style={{ color: "#FBBF24", fontSize: 11, fontWeight: "700" }}>+{daily.xp} XP</Text>
                </View>
                <Text style={{ color: "#8A97AD", fontSize: 12 }}>{TYPE_ICONS[daily.interactionType] ?? "🎮"} {daily.discipline}</Text>
              </View>
              <Text style={{ color: "#FBBF24", fontSize: 13, fontWeight: "600", marginTop: 10 }}>Prihvati izazov →</Text>
            </>
          ) : (
            <Text style={{ color: "#8A97AD", fontSize: 14 }}>Danas nema dnevnog izazova.</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Recommendation: weakest topic */}
      {weakestEntry && (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/missions")}
          style={{ backgroundColor: "#141A2A", borderColor: "rgba(139,92,246,0.3)", borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 16 }}
        >
          <Text style={{ color: "rgba(139,92,246,0.75)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Preporuka</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 22 }}>{TOPIC_ICONS[weakestEntry[0]] ?? "📌"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#E5ECF5", fontSize: 15, fontWeight: "700" }}>Vježbaj: {weakestEntry[0]}</Text>
              <Text style={{ color: "#8A97AD", fontSize: 12, marginTop: 2 }}>Savladanost: {weakestEntry[1]}% — tvoja najslabija oblast</Text>
            </View>
          </View>
          <Text style={{ color: "#8B5CF6", fontSize: 13, fontWeight: "600", marginTop: 10 }}>Idi na misije →</Text>
        </TouchableOpacity>
      )}

      {/* Quick nav */}
      <View style={{ gap: 10 }}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/missions")}
          style={{ backgroundColor: "#141A2A", borderColor: "rgba(34,211,238,0.2)", borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <View>
            <Text style={{ color: "rgba(34,211,238,0.7)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5 }}>Mapa misija</Text>
            <Text style={{ color: "#E5ECF5", fontSize: 15, fontWeight: "600", marginTop: 3 }}>Sve misije</Text>
          </View>
          <Text style={{ color: "#22D3EE", fontSize: 18 }}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/leaderboard")}
          style={{ backgroundColor: "#141A2A", borderColor: "rgba(251,191,36,0.2)", borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <View>
            <Text style={{ color: "rgba(251,191,36,0.7)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5 }}>Takmičenje</Text>
            <Text style={{ color: "#E5ECF5", fontSize: 15, fontWeight: "600", marginTop: 3 }}>Rang lista</Text>
          </View>
          <Text style={{ color: "#FBBF24", fontSize: 18 }}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
