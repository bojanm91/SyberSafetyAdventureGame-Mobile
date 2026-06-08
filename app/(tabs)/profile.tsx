import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import Svg, { Rect, Line, Text as SvgText, Path } from "react-native-svg";
import { useAuth } from "../../contexts/auth-context";
import { apiGetProgress, apiGetMastery, apiGetXpHistory, type ProgressData } from "../../lib/api";
import { T } from "../../lib/theme";
import LevelRing from "../../components/LevelRing";
import RadarChart from "../../components/RadarChart";

const TOPIC_ICONS: Record<string, string> = {
  lozinke: "🔑", phishing: "📧", privatnost: "🛡️", malver: "☣️",
  "javni-wifi": "📶", dvofaktorska: "🔐", "socijalni-inzenjering": "🎭",
  prevare: "⚠️", azuriranja: "🔄", "sigurno-preuzimanje": "📥",
};
const TOPIC_NAMES: Record<string, string> = {
  lozinke: "Lozinke", phishing: "Phishing", privatnost: "Privatnost", malver: "Malver",
  "javni-wifi": "Javni WiFi", dvofaktorska: "2FA", "socijalni-inzenjering": "Soc. inženjering",
  prevare: "Prevare", azuriranja: "Ažuriranja", "sigurno-preuzimanje": "Preuzimanja",
};
const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1300, 1600, 1900, 2200];

function xpPercent(points: number, level: number) {
  const lo = XP_THRESHOLDS[level - 1] ?? 0;
  const hi = XP_THRESHOLDS[level] ?? lo + 300;
  return hi === lo ? 100 : Math.round(((points - lo) / (hi - lo)) * 100);
}

function XpLineChart({ data, width, height }: { data: { date: string; xp: number }[]; width: number; height: number }) {
  if (!data.length) return null;
  const padL = 28, padR = 10, padT = 10, padB = 28;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const maxXp = Math.max(...data.map((d) => d.xp), 1);
  const n = data.length;
  const pts = data.map((d, i) => ({
    x: padL + (i / Math.max(n - 1, 1)) * chartW,
    y: padT + chartH - (d.xp / maxXp) * chartH,
    xp: d.xp, date: d.date.slice(5),
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(padT + chartH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + chartH).toFixed(1)} Z`;
  const yLabels = [0, Math.round(maxXp / 2), maxXp];
  return (
    <Svg width={width} height={height}>
      {yLabels.map((v, i) => (
        <SvgText key={i} x={padL - 4} y={padT + chartH - (v / maxXp) * chartH + 4} fill={T.hudMuted} fontSize={9} textAnchor="end">{v}</SvgText>
      ))}
      {yLabels.map((v, i) => (
        <Line key={i} x1={padL} y1={padT + chartH - (v / maxXp) * chartH} x2={padL + chartW} y2={padT + chartH - (v / maxXp) * chartH} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      <Path d={areaD} fill={`${T.teal}18`} />
      <Path d={pathD} fill="none" stroke={T.teal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.filter((_, i) => i % Math.max(1, Math.floor(n / 4)) === 0 || i === n - 1).map((p, i) => (
        <SvgText key={i} x={p.x} y={padT + chartH + 14} fill={T.hudMuted} fontSize={9} textAnchor="middle">{p.date}</SvgText>
      ))}
      {pts.filter((p) => p.xp > 0).map((p, i) => (
        <Rect key={i} x={p.x - 2.5} y={p.y - 2.5} width={5} height={5} rx={2.5} fill={T.teal} />
      ))}
    </Svg>
  );
}

export default function ProfileScreen() {
  const { user, logout, deleteProfile } = useAuth();
  const router           = useRouter();
  const insets           = useSafeAreaInsets();
  const [progress, setProgress]     = useState<ProgressData | null>(null);
  const [mastery, setMastery]       = useState<Record<string, number>>({});
  const [xpHistory, setXpHistory]   = useState<{ date: string; xp: number }[]>([]);
  const [deleting, setDeleting]     = useState(false);
  const { width: screenWidth }      = useWindowDimensions();
  const chartWidth                  = screenWidth - 64;

  const loadProfile = useCallback(() => {
    if (!user) return;
    apiGetProgress().then(setProgress).catch(console.error);
    apiGetMastery().then(setMastery).catch(console.error);
    apiGetXpHistory().then(setXpHistory).catch(console.error);
  }, [user?.id]);

  useFocusEffect(loadProfile);

  if (!user) return null;
  const p      = progress;
  const level  = p?.profile.level ?? user.level;
  const points = p?.profile.points ?? user.points;
  const pct    = p?.stats.xpPercentage ?? xpPercent(points, level);
  const avatarEmoji = user.avatarBase === "B" ? "🦁" : user.avatarBase === "C" ? "🦊" : user.avatarBase === "D" ? "🐺" : "🛡️";

  const radarData   = Object.entries(mastery).sort((a, b) => a[0].localeCompare(b[0])).map(([slug, val]) => ({ label: TOPIC_NAMES[slug] ?? slug, icon: TOPIC_ICONS[slug] ?? "📌", value: val }));
  const masteryList = Object.entries(mastery).sort((a, b) => a[1] - b[1]);

  const card = { backgroundColor: T.panel, borderColor: T.border, borderWidth: 1, borderRadius: T.rLg, padding: 16, marginBottom: 14 };
  const sectionLabel = { fontFamily: T.fontBody, fontSize: 11, color: T.mint, textTransform: "uppercase" as const, letterSpacing: 1.5, marginBottom: 12 };

  function confirmDeleteProfile() {
    Alert.alert(
      "Obrisati profil?",
      "Ova akcija trajno briše tvoj nalog, bodove, misije i bedževe. Ne može se poništiti.",
      [
        { text: "Odustani", style: "cancel" },
        {
          text: "Obriši profil",
          style: "destructive",
          onPress: () => void handleDeleteProfile(),
        },
      ],
    );
  }

  async function handleDeleteProfile() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteProfile();
      router.replace("/register");
    } catch (err) {
      setDeleting(false);
      Alert.alert(
        "Brisanje nije uspjelo",
        err instanceof Error ? err.message : "Pokušaj ponovo za nekoliko trenutaka.",
      );
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <LinearGradient
        colors={[T.scene1, T.scene2, T.bg]}
        locations={[0, 0.35, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200 }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={{ ...card, borderColor: "rgba(24,165,130,0.25)" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <LevelRing level={level} xpPercent={pct} size={90} avatarEmoji={avatarEmoji} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: T.fontBody, fontSize: 11, color: T.mint, textTransform: "uppercase", letterSpacing: 2 }}>Cyber Agent</Text>
              <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 20, marginTop: 2 }}>{user.codename ?? user.username}</Text>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 12, marginTop: 1 }}>{p?.profile.email ?? user.email}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                <View style={{ backgroundColor: T.primarySoft, borderColor: "rgba(62,155,232,0.3)", borderWidth: 1, borderRadius: T.rPill, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ fontFamily: T.fontBody, color: T.primary, fontSize: 11 }}>{p?.profile.status ?? user.status}</Text>
                </View>
                {(p?.profile.streak ?? user.streak) > 0 && (
                  <View style={{ backgroundColor: "rgba(250,199,117,0.15)", borderColor: "rgba(250,199,117,0.3)", borderWidth: 1, borderRadius: T.rPill, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ fontFamily: T.fontBody, color: T.sun, fontSize: 11 }}>🔥 {p?.profile.streak ?? user.streak}d</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontFamily: T.fontBodyXBold, color: T.sun, fontSize: 22 }}>{points.toLocaleString()}</Text>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11 }}>bodova</Text>
            </View>
          </View>

          {/* XP bar */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 12 }}>XP do Level {level + 1}</Text>
              <Text style={{ fontFamily: T.fontBodyXBold, color: T.hudInk, fontSize: 12 }}>{pct}%</Text>
            </View>
            <View style={{ height: 7, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden" }}>
              <LinearGradient
                colors={[T.mint, T.tealDeep]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: "100%", width: `${pct}%`, borderRadius: 999 }}
              />
            </View>
          </View>
        </View>

        {/* Stats grid */}
        {p && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Bodovi",           value: p.profile.points.toLocaleString(), color: T.sun },
              { label: "Bedževi",          value: String(p.stats.badgesCount),       color: T.coral },
              { label: "Završene misije",  value: `${p.stats.completedQuests}/${p.stats.totalQuests}`, color: T.mint },
              { label: "Streak",           value: `${p.profile.streak}d`,            color: T.primary },
            ].map((s) => (
              <View key={s.label} style={{ width: "47%", ...card, marginBottom: 0, padding: 14, alignItems: "center" }}>
                <Text style={{ fontFamily: T.fontBodyXBold, color: s.color, fontSize: 20 }}>{s.value}</Text>
                <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginTop: 3, textAlign: "center" }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Radar */}
        {radarData.length >= 3 && (
          <View style={{ ...card, alignItems: "center" }}>
            <Text style={{ ...sectionLabel, alignSelf: "flex-start" }}>Mapa kompetencija</Text>
            <RadarChart data={radarData} size={240} />
          </View>
        )}

        {/* Mastery bars */}
        {masteryList.length > 0 && (
          <View style={card}>
            <Text style={sectionLabel}>Savladanost po temama</Text>
            <View style={{ gap: 10 }}>
              {masteryList.map(([slug, val], idx) => {
                const isWeakest = idx === 0;
                const barColor  = val >= 70 ? T.good : val >= 40 ? T.sun : T.bad;
                return (
                  <View key={slug}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontSize: 14 }}>{TOPIC_ICONS[slug] ?? "📌"}</Text>
                        <Text style={{ fontFamily: T.fontBody, color: isWeakest ? T.bad : T.hudInk, fontSize: 13 }}>
                          {TOPIC_NAMES[slug] ?? slug}{isWeakest ? " ⚡" : ""}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: T.fontBodyXBold, color: barColor, fontSize: 12 }}>{val}%</Text>
                    </View>
                    <View style={{ height: 5, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
                      <View style={{ height: "100%", width: `${val}%`, backgroundColor: barColor, borderRadius: 999 }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* XP history */}
        {xpHistory.length > 1 && (
          <View style={card}>
            <Text style={sectionLabel}>XP po danu (14 dana)</Text>
            <XpLineChart data={xpHistory} width={chartWidth} height={120} />
          </View>
        )}

        {/* Discipline progress */}
        {p && Object.keys(p.disciplineStats).length > 0 && (
          <View style={card}>
            <Text style={sectionLabel}>Napredak po disciplinama</Text>
            <View style={{ gap: 10 }}>
              {Object.entries(p.disciplineStats).map(([slug, stats]) => {
                const pct2 = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                return (
                  <View key={slug}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontFamily: T.fontBody, color: T.hudInk, fontSize: 13 }}>{slug}</Text>
                      <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11 }}>{stats.completed}/{stats.total} · {stats.points}p</Text>
                    </View>
                    <View style={{ height: 5, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
                      <LinearGradient
                        colors={[T.mint, T.tealDeep]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ height: "100%", width: `${pct2}%`, borderRadius: 999 }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Badges */}
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 17, marginBottom: 12 }}>Bedževi ({p?.badges.length ?? 0})</Text>
          {p?.badges.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {p.badges.map((b) => (
                <View key={b.id} style={{ ...card, marginBottom: 0, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, width: "47%" }}>
                  <Text style={{ fontSize: 26 }}>{b.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: T.fontBody, color: T.hudInk, fontSize: 13 }} numberOfLines={1}>{b.name}</Text>
                    <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11, marginTop: 2 }} numberOfLines={2}>{b.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ ...card, padding: 24, alignItems: "center" }}>
              <Text style={{ fontSize: 32, marginBottom: 10 }}>🏅</Text>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 13, textAlign: "center" }}>Završi misije da osvoji bedževe.</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/missions")}
                style={{ marginTop: 14, backgroundColor: T.tealDeep, borderRadius: T.rPill, paddingHorizontal: 20, paddingVertical: 10 }}
              >
                <Text style={{ fontFamily: T.fontBody, color: "#fff", fontSize: 13 }}>Idi na misije</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={logout}
          style={{ borderColor: T.border, borderWidth: 1, borderRadius: T.rMd, paddingVertical: 14, alignItems: "center" }}
        >
          <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14 }}>Odjavi se</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={confirmDeleteProfile}
          disabled={deleting}
          style={{
            marginTop: 10,
            borderColor: "rgba(239,68,68,0.55)",
            backgroundColor: "rgba(239,68,68,0.08)",
            borderWidth: 1.5,
            borderRadius: T.rMd,
            paddingVertical: 14,
            alignItems: "center",
            opacity: deleting ? 0.65 : 1,
          }}
        >
          {deleting ? (
            <ActivityIndicator color={T.bad} />
          ) : (
            <Text style={{ fontFamily: T.fontBodyXBold, color: T.bad, fontSize: 14 }}>Obriši profil</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
