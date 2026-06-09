import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { useAuth } from "../../contexts/auth-context";
import {
  apiGetProgress, apiGetDailyChallenge, apiGetMastery,
  type ProgressData, type DailyChallenge,
} from "../../lib/api";
import { T } from "../../lib/theme";
import LevelRing from "../../components/LevelRing";
import ByteGreeting from "../../components/ByteGreeting";
import { getMissionStats, type MissionStats } from "../../lib/mission-progress";
import { APP_NAME } from "../../lib/branding";
import { formatCompact } from "../../lib/format";

const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1300, 1600, 1900, 2200];

function xpPercent(points: number, level: number): number {
  const lo = XP_THRESHOLDS[level - 1] ?? 0;
  const hi = XP_THRESHOLDS[level] ?? lo + 300;
  return hi === lo ? 100 : Math.round(((points - lo) / (hi - lo)) * 100);
}
function xpToNext(points: number, level: number): number {
  return Math.max(0, (XP_THRESHOLDS[level] ?? (XP_THRESHOLDS[level - 1] ?? 0) + 300) - points);
}

/** Mini kružni indikator napretka s brojem levela u centru (za gornju kapsulu). */
function MiniRing({ pct, level, size = 26 }: { pct: number; level: number; size?: number }) {
  const sw = 3;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, pct / 100)));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.16)" strokeWidth={sw} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={T.sun} strokeWidth={sw} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontFamily: T.fontBodyXBold, color: T.sun, fontSize: size * 0.42 }}>{level}</Text>
    </View>
  );
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
  const { user, justLoggedIn, ackLogin } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [showByte, setShowByte] = useState(false);

  // Pri svježoj prijavi: Bajt iskoči sa zanimljivom činjenicom (jednom).
  useEffect(() => {
    if (justLoggedIn) {
      setShowByte(true);
      ackLogin();
    }
  }, [justLoggedIn]);

  const [progress, setProgress]         = useState<ProgressData | null>(null);
  const [daily, setDaily]               = useState<DailyChallenge | null | undefined>(undefined);
  const [mastery, setMastery]           = useState<Record<string, number>>({});
  const [missionStats, setMissionStats] = useState<MissionStats | null>(null);
  const [loadingProgress, setLoading]   = useState(true);
  const [error, setError]               = useState("");

  const loadDashboard = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    Promise.all([
      apiGetProgress().then(setProgress).catch(() => setError("Nije moguće učitati profil.")),
      apiGetDailyChallenge().then(setDaily).catch(() => setDaily(null)),
      apiGetMastery().then(setMastery).catch(() => {}),
      getMissionStats(user.id).then(setMissionStats).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user?.id]);

  useFocusEffect(loadDashboard);

  if (!user) return null;

  const level   = progress?.profile.level ?? user.level;
  const points  = progress?.profile.points ?? user.points;
  const streak  = progress?.profile.streak ?? user.streak;
  const pct     = progress?.stats.xpPercentage ?? xpPercent(points, level);
  const toNext  = progress?.stats.xpToNextLevel ?? xpToNext(points, level);
  const status  = progress?.profile.status ?? user.status;

  const masteryValues = Object.values(mastery);
  const avgMastery = masteryValues.length > 0
    ? Math.round(masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length) : 0;
  const weakestEntry = Object.entries(mastery).sort((a, b) => a[1] - b[1])[0];

  const missionValue = `${missionStats?.completed ?? progress?.stats.completedQuests ?? 0}/${missionStats?.total ?? progress?.stats.totalQuests ?? 0}`;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <LinearGradient
        colors={[T.scene1, T.scene2, T.bg]}
        locations={[0, 0.4, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260 }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <View style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "rgba(34,211,238,0.12)",
              borderWidth: 1,
              borderColor: "rgba(34,211,238,0.28)",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Text style={{ fontFamily: T.fontHead, fontSize: 14, color: T.teal }}>CS</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontFamily: T.fontHead, fontSize: 17, color: T.hudInk }}>
                {APP_NAME}
              </Text>
              <Text numberOfLines={1} style={{ fontFamily: T.fontBody, fontSize: 11, color: T.hudMuted, marginTop: 1 }}>
                Baza agenta
              </Text>
            </View>
          </View>

          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: "rgba(250,199,117,0.28)",
            backgroundColor: "rgba(250,199,117,0.11)",
            borderRadius: T.rPill,
            paddingLeft: 7,
            paddingRight: 13,
            paddingVertical: 6,
          }}>
            <MiniRing pct={pct} level={level} />
            <Text style={{ fontFamily: T.fontBodyXBold, color: T.sun, fontSize: 13 }}>
              {formatCompact(points)} XP
            </Text>
          </View>
        </View>

        {error ? (
          <View style={{ backgroundColor: T.badSoft, borderColor: T.bad, borderWidth: 1, borderRadius: T.rMd, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontFamily: T.fontBody, color: T.badInk, fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}

        {/* Hero: user card */}
        <View style={{
          backgroundColor: T.panel, borderColor: T.border,
          borderWidth: 1, borderRadius: T.rLg, padding: 20, marginBottom: 14,
          ...T.shadowCard,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {loadingProgress ? (
              <View style={{ width: 100, height: 100, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color={T.teal} />
              </View>
            ) : (
              <LevelRing
                level={level}
                xpPercent={pct}
                size={100}
                avatarBase={user.avatarBase}
                avatarColor={user.avatarColor}
                avatarGear={user.avatarGear}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: T.fontBody, fontSize: 11, color: T.mint, textTransform: "uppercase", letterSpacing: 2 }}>
                Agent
              </Text>
              <Text style={{ fontFamily: T.fontHead, fontSize: 22, color: T.hudInk, marginTop: 2 }}>
                {user.codename ?? user.username}
              </Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <View style={{ backgroundColor: T.primarySoft, borderColor: "rgba(62,155,232,0.3)", borderWidth: 1, borderRadius: T.rPill, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ fontFamily: T.fontBody, color: T.primary, fontSize: 11 }}>{status}</Text>
                </View>
                {streak > 0 && (
                  <View style={{ backgroundColor: "rgba(250,199,117,0.15)", borderColor: "rgba(250,199,117,0.3)", borderWidth: 1, borderRadius: T.rPill, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ fontFamily: T.fontBody, color: T.sun, fontSize: 11 }}>🔥 {streak}d</Text>
                  </View>
                )}
              </View>
              <View style={{ marginTop: 12 }}>
                {/* Level chipovi + procenat */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <View style={{ backgroundColor: "rgba(34,211,238,0.14)", borderColor: "rgba(34,211,238,0.3)", borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: T.fontBodyXBold, color: T.teal, fontSize: 10 }}>L{level}</Text>
                  </View>
                  <Text style={{ fontFamily: T.fontBodyXBold, color: T.teal, fontSize: 11 }}>{pct}%</Text>
                  <View style={{ backgroundColor: "rgba(139,92,246,0.14)", borderColor: "rgba(139,92,246,0.3)", borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: T.fontBodyXBold, color: "#A78BFA", fontSize: 10 }}>L{level + 1}</Text>
                  </View>
                </View>
                {/* Track + gradijent + marker */}
                <View style={{ height: 9, backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 999, justifyContent: "center" }}>
                  <LinearGradient
                    colors={[T.mint, T.teal, "#8B5CF6"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.max(pct, 3)}%`, borderRadius: 999 }}
                  />
                  <View style={{
                    position: "absolute", left: `${pct}%`, marginLeft: -7,
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: "#fff", borderWidth: 2.5, borderColor: T.teal,
                    shadowColor: T.teal, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 4,
                  }} />
                </View>
                {/* XP brojevi */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 7 }}>
                  <Text style={{ fontFamily: T.fontBodyXBold, color: T.hudInk, fontSize: 11 }}>{formatCompact(points)} XP</Text>
                  <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11 }}>+{formatCompact(toNext)} do L{level + 1}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Bodovi", value: formatCompact(points), color: T.sun },
            { label: "Misije", value: missionValue, color: T.mint },
            { label: "Bedževi", value: String(progress?.stats.badgesCount ?? 0), color: T.coral },
          ].map((s) => (
            <View key={s.label} style={{
              flex: 1, backgroundColor: T.panel, borderColor: T.border,
              borderWidth: 1, borderRadius: T.rMd, padding: 12, alignItems: "center",
            }}>
              <Text style={{ fontFamily: T.fontBodyXBold, fontSize: 16, color: s.color }}>{s.value}</Text>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginTop: 3, textAlign: "center" }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Signal gauge */}
        <View style={{
          backgroundColor: T.panel, borderColor: T.border,
          borderWidth: 1, borderRadius: T.rLg, padding: 16, marginBottom: 14,
        }}>
          <Text style={{ fontFamily: T.fontBody, fontSize: 11, color: T.mint, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            Status mreže
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ height: 9, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
                <View style={{
                  height: "100%", width: `${avgMastery}%`, borderRadius: 999,
                  backgroundColor: avgMastery >= 70 ? T.good : avgMastery >= 40 ? T.sun : T.bad,
                }} />
              </View>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11, marginTop: 6 }}>
                Prosječno savladavanje: {avgMastery}%
              </Text>
            </View>
            <Text style={{ fontFamily: T.fontBody, fontSize: 13, color: avgMastery >= 70 ? T.good : avgMastery >= 40 ? T.sun : T.bad }}>
              {avgMastery >= 70 ? "✓ Sigurno" : avgMastery >= 40 ? "~ U razvoju" : "! Ugroženo"}
            </Text>
          </View>
        </View>

        {/* Daily challenge */}
        {daily !== undefined && (
          <TouchableOpacity
            onPress={() => daily && router.push(`/game/${daily.id}`)}
            disabled={!daily}
            style={{
              backgroundColor: daily ? "rgba(250,199,117,0.08)" : T.panel,
              borderWidth: 1.5,
              borderColor: daily ? "rgba(250,199,117,0.4)" : T.border,
              borderRadius: T.rLg, padding: 16, marginBottom: 14,
              opacity: daily ? 1 : 0.6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 18 }}>☀️</Text>
              <Text style={{ fontFamily: T.fontBody, color: T.sun, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5 }}>Dnevni izazov</Text>
            </View>
            {daily ? (
              <>
                <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 17, lineHeight: 22 }}>{daily.title}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <View style={{ backgroundColor: "rgba(250,199,117,0.15)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(250,199,117,0.3)" }}>
                    <Text style={{ fontFamily: T.fontBodyXBold, color: T.sun, fontSize: 11 }}>+{daily.xp} XP</Text>
                  </View>
                  <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 12 }}>{TYPE_ICONS[daily.interactionType] ?? "🎮"} {daily.discipline}</Text>
                </View>
                <Text style={{ fontFamily: T.fontBody, color: T.sun, fontSize: 13, marginTop: 10 }}>Prihvati izazov →</Text>
              </>
            ) : (
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14 }}>Danas nema dnevnog izazova.</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Preporuka */}
        {weakestEntry && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/missions")}
            style={{
              backgroundColor: T.panel, borderColor: "rgba(93,202,165,0.3)",
              borderWidth: 1, borderRadius: T.rLg, padding: 16, marginBottom: 14,
            }}
          >
            <Text style={{ fontFamily: T.fontBody, color: T.mint, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Preporuka</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 22 }}>{TOPIC_ICONS[weakestEntry[0]] ?? "📌"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 15 }}>Vježbaj: {weakestEntry[0]}</Text>
                <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 12, marginTop: 2 }}>Savladanost: {weakestEntry[1]}% — najslabija oblast</Text>
              </View>
            </View>
            <Text style={{ fontFamily: T.fontBody, color: T.teal, fontSize: 13, marginTop: 10 }}>Idi na misije →</Text>
          </TouchableOpacity>
        )}

        {/* Quick nav */}
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/missions")}
            style={{
              backgroundColor: T.panel, borderColor: T.primarySoft,
              borderWidth: 1, borderRadius: T.rLg, padding: 16,
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={{ fontFamily: T.fontBody, color: T.mint, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5 }}>Mapa misija</Text>
              <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 15, marginTop: 3 }}>Sve misije</Text>
            </View>
            <Text style={{ color: T.primary, fontSize: 18 }}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/leaderboard")}
            style={{
              backgroundColor: T.panel, borderColor: "rgba(250,199,117,0.2)",
              borderWidth: 1, borderRadius: T.rLg, padding: 16,
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={{ fontFamily: T.fontBody, color: T.sun, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5 }}>Takmičenje</Text>
              <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 15, marginTop: 3 }}>Rang lista</Text>
            </View>
            <Text style={{ color: T.sun, fontSize: 18 }}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ByteGreeting
        visible={showByte}
        onClose={() => setShowByte(false)}
        name={user.codename ?? user.username}
      />
    </View>
  );
}
