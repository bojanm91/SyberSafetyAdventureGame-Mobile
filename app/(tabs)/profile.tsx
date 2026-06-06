import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Svg, { Rect, Line, Text as SvgText, Path } from "react-native-svg";
import { useAuth } from "../../contexts/auth-context";
import { apiGetProgress, apiGetMastery, apiGetXpHistory, type ProgressData } from "../../lib/api";
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

function xpPercent(points: number, level: number): number {
  const lo = XP_THRESHOLDS[level - 1] ?? 0;
  const hi = XP_THRESHOLDS[level] ?? lo + 300;
  if (hi === lo) return 100;
  return Math.round(((points - lo) / (hi - lo)) * 100);
}

// ─── XP Line Chart ──────────────────────────────────────────────────────────

function XpLineChart({ data, width, height }: { data: { date: string; xp: number }[]; width: number; height: number }) {
  if (!data.length) return null;

  const padL = 28;
  const padR = 10;
  const padT = 10;
  const padB = 28;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxXp = Math.max(...data.map((d) => d.xp), 1);
  const n = data.length;

  const pts = data.map((d, i) => ({
    x: padL + (i / Math.max(n - 1, 1)) * chartW,
    y: padT + chartH - (d.xp / maxXp) * chartH,
    xp: d.xp,
    date: d.date.slice(5), // MM-DD
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(padT + chartH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + chartH).toFixed(1)} Z`;

  const yLabels = [0, Math.round(maxXp / 2), maxXp];

  return (
    <Svg width={width} height={height}>
      {/* Y axis labels */}
      {yLabels.map((v, i) => (
        <SvgText
          key={i}
          x={padL - 4}
          y={padT + chartH - (v / maxXp) * chartH + 4}
          fill="#8A97AD"
          fontSize={9}
          textAnchor="end"
        >
          {v}
        </SvgText>
      ))}

      {/* Horizontal grid lines */}
      {yLabels.map((v, i) => (
        <Line
          key={i}
          x1={padL}
          y1={padT + chartH - (v / maxXp) * chartH}
          x2={padL + chartW}
          y2={padT + chartH - (v / maxXp) * chartH}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={1}
        />
      ))}

      {/* Area fill */}
      <Path d={areaD} fill="rgba(34,211,238,0.08)" />

      {/* Line */}
      <Path d={pathD} fill="none" stroke="#22D3EE" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* X axis labels: every ~4th point */}
      {pts.filter((_, i) => i % Math.max(1, Math.floor(n / 4)) === 0 || i === n - 1).map((p, i) => (
        <SvgText key={i} x={p.x} y={padT + chartH + 14} fill="#8A97AD" fontSize={9} textAnchor="middle">
          {p.date}
        </SvgText>
      ))}

      {/* Dots for non-zero */}
      {pts.filter((p) => p.xp > 0).map((p, i) => (
        <Rect key={i} x={p.x - 2.5} y={p.y - 2.5} width={5} height={5} rx={2.5} fill="#22D3EE" />
      ))}
    </Svg>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [mastery, setMastery] = useState<Record<string, number>>({});
  const [xpHistory, setXpHistory] = useState<{ date: string; xp: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    apiGetProgress().then(setProgress).catch(console.error);
    apiGetMastery().then(setMastery).catch(console.error);
    apiGetXpHistory().then(setXpHistory).catch(console.error);
  }, [user]);

  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64; // 16px horizontal padding × 2 + 16px card padding × 2

  if (!user) return null;
  const p = progress;
  const level = p?.profile.level ?? user.level;
  const points = p?.profile.points ?? user.points;
  const pct = p?.stats.xpPercentage ?? xpPercent(points, level);

  const avatarEmoji = user.avatarBase === "B" ? "🦁" : user.avatarBase === "C" ? "🦊" : user.avatarBase === "D" ? "🐺" : "🛡️";

  // Radar data from mastery
  const radarData = Object.entries(mastery)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([slug, val]) => ({
      label: TOPIC_NAMES[slug] ?? slug,
      icon: TOPIC_ICONS[slug] ?? "📌",
      value: val,
    }));

  // Mastery bar list (sorted weakest first)
  const masteryList = Object.entries(mastery).sort((a, b) => a[1] - b[1]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0B0F1A" }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24, paddingHorizontal: 16 }}
    >
      {/* Profile card */}
      <View style={{ backgroundColor: "#141A2A", borderColor: "rgba(34,211,238,0.2)", borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <LevelRing level={level} xpPercent={pct} size={90} avatarEmoji={avatarEmoji} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(34,211,238,0.75)", fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>Cyber Agent</Text>
            <Text style={{ color: "#E5ECF5", fontSize: 20, fontWeight: "800", marginTop: 2 }}>
              {user.codename ?? user.username}
            </Text>
            <Text style={{ color: "#8A97AD", fontSize: 12, marginTop: 1 }}>{p?.profile.email ?? user.email}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              <View style={{ backgroundColor: "rgba(34,211,238,0.1)", borderColor: "rgba(34,211,238,0.25)", borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ color: "#22D3EE", fontSize: 11, fontWeight: "700" }}>{p?.profile.status ?? user.status}</Text>
              </View>
              {(p?.profile.streak ?? user.streak) > 0 && (
                <View style={{ backgroundColor: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.25)", borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ color: "#FBBF24", fontSize: 11, fontWeight: "700" }}>🔥 {p?.profile.streak ?? user.streak}d</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: "#E5ECF5", fontSize: 22, fontWeight: "800" }}>{points.toLocaleString()}</Text>
            <Text style={{ color: "#8A97AD", fontSize: 11 }}>bodova</Text>
          </View>
        </View>

        {/* XP bar */}
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ color: "#8A97AD", fontSize: 12 }}>XP do Level {level + 1}</Text>
            <Text style={{ color: "#E5ECF5", fontSize: 12, fontWeight: "600" }}>{pct}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: "#1C2436", borderRadius: 99, overflow: "hidden" }}>
            <LinearGradient
              colors={["#22D3EE", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: "100%", width: `${pct}%`, borderRadius: 99 }}
            />
          </View>
        </View>
      </View>

      {/* Stats grid */}
      {p && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Bodovi", value: p.profile.points.toLocaleString() },
            { label: "Bedževi", value: p.stats.badgesCount },
            { label: "Završene misije", value: `${p.stats.completedQuests}/${p.stats.totalQuests}` },
            { label: "Streak", value: `${p.profile.streak}d` },
          ].map((s) => (
            <View key={s.label} style={{ width: "47%", backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "center" }}>
              <Text style={{ color: "#E5ECF5", fontSize: 20, fontWeight: "800" }}>{s.value}</Text>
              <Text style={{ color: "#8A97AD", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginTop: 3, textAlign: "center" }}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Radar chart */}
      {radarData.length >= 3 && (
        <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 16, alignItems: "center" }}>
          <Text style={{ color: "rgba(34,211,238,0.75)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, alignSelf: "flex-start", marginBottom: 8 }}>Mapa kompetencija</Text>
          <RadarChart data={radarData} size={240} />
        </View>
      )}

      {/* Mastery bars */}
      {masteryList.length > 0 && (
        <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "rgba(34,211,238,0.75)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Savladanost po temama</Text>
          <View style={{ gap: 10 }}>
            {masteryList.map(([slug, val]) => {
              const isWeakest = slug === masteryList[0][0];
              const barColor = val >= 70 ? "#34D399" : val >= 40 ? "#FBBF24" : "#F87171";
              return (
                <View key={slug}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 14 }}>{TOPIC_ICONS[slug] ?? "📌"}</Text>
                      <Text style={{ color: isWeakest ? "#F87171" : "#E5ECF5", fontSize: 13, fontWeight: isWeakest ? "700" : "500" }}>
                        {TOPIC_NAMES[slug] ?? slug}
                        {isWeakest ? " ⚡" : ""}
                      </Text>
                    </View>
                    <Text style={{ color: barColor, fontSize: 12, fontWeight: "700" }}>{val}%</Text>
                  </View>
                  <View style={{ height: 5, backgroundColor: "#1C2436", borderRadius: 99, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${val}%`, backgroundColor: barColor, borderRadius: 99 }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* XP history chart */}
      {xpHistory.length > 1 && (
        <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "rgba(34,211,238,0.75)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>XP po danu (poslijednjih 14 dana)</Text>
          <XpLineChart data={xpHistory} width={chartWidth} height={120} />
        </View>
      )}

      {/* Legacy discipline progress (if available) */}
      {p && Object.keys(p.disciplineStats).length > 0 && (
        <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "rgba(34,211,238,0.75)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Napredak po disciplinama</Text>
          <View style={{ gap: 10 }}>
            {Object.entries(p.disciplineStats).map(([slug, stats]) => {
              const pct2 = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              return (
                <View key={slug}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ color: "#E5ECF5", fontSize: 13 }}>{slug}</Text>
                    <Text style={{ color: "#8A97AD", fontSize: 11 }}>{stats.completed}/{stats.total} · {stats.points}p</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: "#1C2436", borderRadius: 99, overflow: "hidden" }}>
                    <LinearGradient
                      colors={["#22D3EE", "#8B5CF6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: "100%", width: `${pct2}%`, borderRadius: 99 }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Badges */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: "#E5ECF5", fontSize: 17, fontWeight: "700", marginBottom: 12 }}>Bedževi ({p?.badges.length ?? 0})</Text>
        {p?.badges.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {p.badges.map((b) => (
              <View key={b.id} style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, width: "47%" }}>
                <Text style={{ fontSize: 26 }}>{b.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#E5ECF5", fontSize: 13, fontWeight: "600" }} numberOfLines={1}>{b.name}</Text>
                  <Text style={{ color: "#8A97AD", fontSize: 11, marginTop: 2 }} numberOfLines={2}>{b.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 16, padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 32, marginBottom: 10 }}>🏅</Text>
            <Text style={{ color: "#8A97AD", fontSize: 13, textAlign: "center" }}>Završi misije da osvoji bedževe.</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/missions")}
              style={{ marginTop: 14, backgroundColor: "#22D3EE", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
            >
              <Text style={{ color: "#0B0F1A", fontWeight: "700", fontSize: 13 }}>Idi na misije</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={logout}
        style={{ borderColor: "#26304A", borderWidth: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center" }}
      >
        <Text style={{ color: "#8A97AD", fontSize: 14 }}>Odjavi se</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
