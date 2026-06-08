import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Easing, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/auth-context";
import { apiGetScenarios, type ScenarioSummary } from "../../lib/api";
import { T } from "../../lib/theme";

// ── Region map definition (top → bottom: Citadela → Akademija) ───────────────

type NodeState = "done" | "current" | "locked";

const REGION_DEF = [
  {
    id: "citadela",
    name: "Citadela",
    sub: "Finale",
    icon: "✦",
    color: T.sun,
    glowColor: "rgba(250,199,117,0.35)",
    discSlugs: [] as string[],
  },
  {
    id: "pecine",
    name: "Pećine Malvera",
    sub: "Malver & virusi",
    icon: "☣",
    color: "#9B6ED4",
    glowColor: "rgba(155,110,212,0.35)",
    discSlugs: ["malver", "malware", "virusi"],
  },
  {
    id: "tvrdjava",
    name: "Tvrđava Baze",
    sub: "Privatnost & zaštita",
    icon: "🔒",
    color: T.primary,
    glowColor: T.primarySoft,
    discSlugs: ["privatnost", "podaci", "dvofaktorska", "azuriranja", "sigurno-preuzimanje", "javni-wifi"],
  },
  {
    id: "mocvara",
    name: "Močvara Phishinga",
    sub: "Phishing & prevare",
    icon: "🎣",
    color: "#4CAF82",
    glowColor: "rgba(76,175,130,0.3)",
    discSlugs: ["phishing", "socijalni-inzenjering", "prevare", "phishing_inbox"],
  },
  {
    id: "luka_lozinki",
    name: "Luka Lozinki",
    sub: "Lozinke & nalozi",
    icon: "⚓",
    color: T.teal,
    glowColor: "rgba(24,165,130,0.35)",
    discSlugs: ["lozinke", "lozinka"],
  },
  {
    id: "akademija",
    name: "Akademija",
    sub: "Uvod i osnove",
    icon: "★",
    color: T.coral,
    glowColor: "rgba(240,153,123,0.35)",
    discSlugs: ["uvod", "osnove", "akademija"],
  },
] as const;

type Region = typeof REGION_DEF[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapToRegionId(disciplineSlug: string): string {
  for (const r of REGION_DEF) {
    if ((r.discSlugs as readonly string[]).includes(disciplineSlug)) return r.id;
  }
  // fallback: assign to Tvrđava Baze (catch-all)
  return "tvrdjava";
}

function computeStates(
  regionScenarios: Record<string, ScenarioSummary[]>
): Record<string, NodeState> {
  const states: Record<string, NodeState> = {};

  // Bottom→top (Akademija to Citadela = last to first in REGION_DEF)
  let firstCurrentSet = false;
  for (let i = REGION_DEF.length - 1; i >= 0; i--) {
    const r = REGION_DEF[i];
    const scs = regionScenarios[r.id] ?? [];

    if (scs.length === 0) {
      states[r.id] = "locked";
    } else if (scs.every((s) => s.completed)) {
      states[r.id] = "done";
    } else if (!firstCurrentSet) {
      states[r.id] = "current";
      firstCurrentSet = true;
    } else {
      // Has scenarios but a closer region is already "current" → locked for now
      states[r.id] = "locked";
    }
  }
  return states;
}

const DIFF_COLOR: Record<string, string> = {
  easy: T.good, medium: T.sun, hard: T.bad,
};
const DIFF_LABEL: Record<string, string> = {
  easy: "Lako", medium: "Srednje", hard: "Teško",
};

// ── Pulse animation for current node ─────────────────────────────────────────

function PulseRing({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const opacity = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 0.2, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
        borderWidth: 2, borderColor: color,
        transform: [{ scale }], opacity,
      }}
    />
  );
}

// ── Node circle ───────────────────────────────────────────────────────────────

const NODE_SIZE = 68;

function NodeCircle({
  region, state, onPress,
}: {
  region: Region; state: NodeState; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={state !== "locked" ? onPress : undefined}
      activeOpacity={state === "locked" ? 1 : 0.75}
      style={{ alignItems: "center", justifyContent: "center" }}
    >
      {state === "current" && <PulseRing color={region.color} />}

      <View style={[
        s.nodeCircle,
        state === "done"    && { backgroundColor: region.glowColor, borderColor: region.color },
        state === "current" && { backgroundColor: region.glowColor, borderColor: region.color, shadowColor: region.color, shadowRadius: 14, shadowOpacity: 0.6, elevation: 12 },
        state === "locked"  && { backgroundColor: T.panelDeep, borderColor: T.border, opacity: 0.45 },
      ]}>
        {state === "locked" ? (
          <Text style={{ fontSize: 24 }}>🔒</Text>
        ) : (
          <Text style={{ fontSize: 26 }}>{region.icon}</Text>
        )}
        {state === "done" && (
          <View style={s.doneBadge}>
            <Text style={{ fontSize: 9, color: "#fff" }}>✓</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Expanded scenarios panel ──────────────────────────────────────────────────

function RegionPanel({
  region, scenarios, onClose,
}: {
  region: Region; scenarios: ScenarioSummary[]; onClose: () => void;
}) {
  const router = useRouter();

  if (scenarios.length === 0) return null;

  const done  = scenarios.filter((s) => s.completed).length;
  const total = scenarios.length;

  return (
    <View style={[s.panel, { borderColor: region.color }]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <View>
          <Text style={[s.panelTitle, { color: region.color }]}>{region.name}</Text>
          <Text style={s.panelSub}>{done}/{total} misija završeno</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Text style={{ color: T.hudMuted, fontSize: 15 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={s.progBar}>
        <View style={[s.progFill, { width: `${total > 0 ? (done / total) * 100 : 0}%` as any, backgroundColor: region.color }]} />
      </View>

      {/* Scenario list */}
      <View style={{ gap: 8, marginTop: 10 }}>
        {scenarios.map((sc) => (
          <TouchableOpacity
            key={sc.id}
            onPress={() => router.push(`/game/${sc.id}`)}
            style={[s.scCard, sc.completed && { backgroundColor: "rgba(22,148,102,0.06)", borderColor: "rgba(22,148,102,0.25)" }]}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
                {sc.difficulty && (
                  <View style={[s.chip, { borderColor: `${DIFF_COLOR[sc.difficulty] ?? T.hudMuted}40`, backgroundColor: `${DIFF_COLOR[sc.difficulty] ?? T.hudMuted}12` }]}>
                    <Text style={{ fontFamily: T.fontBody, color: DIFF_COLOR[sc.difficulty] ?? T.hudMuted, fontSize: 10 }}>
                      {DIFF_LABEL[sc.difficulty] ?? sc.difficulty}
                    </Text>
                  </View>
                )}
                {sc.completed && (
                  <View style={[s.chip, { borderColor: "rgba(22,148,102,0.3)", backgroundColor: "rgba(22,148,102,0.12)" }]}>
                    <Text style={{ fontFamily: T.fontBody, color: T.good, fontSize: 10 }}>✓ Završeno</Text>
                  </View>
                )}
              </View>
              <Text style={s.scTitle}>{sc.title}</Text>
              <Text style={[s.scCta, { color: region.color }]}>{sc.completed ? "Ponovi →" : "Igraj →"}</Text>
            </View>
            <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
              <Text style={s.scXp}>+{sc.xp}</Text>
              <Text style={s.scXpLabel}>XP</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MissionsScreen() {
  const { user }      = useAuth();
  const insets        = useSafeAreaInsets();
  const [scenarios,   setScenarios]   = useState<ScenarioSummary[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [expandedId,  setExpandedId]  = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiGetScenarios()
      .then(setScenarios)
      .catch(() => setError("Nije moguće učitati misije."))
      .finally(() => setLoading(false));
  }, [user]);

  // Group scenarios by region
  const regionScenarios: Record<string, ScenarioSummary[]> = {};
  for (const r of REGION_DEF) regionScenarios[r.id] = [];
  for (const sc of scenarios) {
    const rId = mapToRegionId(sc.discipline.slug);
    (regionScenarios[rId] ??= []).push(sc);
  }

  const nodeStates = computeStates(regionScenarios);

  const totalDone  = scenarios.filter((s) => s.completed).length;
  const totalCount = scenarios.length;

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <LinearGradient
        colors={[T.scene1, T.scene2, T.bg]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <Text style={{ fontFamily: T.fontBody, color: T.mint, fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>
            Mapa Mreže
          </Text>
          <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 26, marginTop: 2 }}>Mreža</Text>
          <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 13, marginTop: 3 }}>
            Tvoja putanja kroz 5 regija{totalCount > 0 ? ` · ${totalDone}/${totalCount} misija` : ""}
          </Text>
        </View>

        {error ? (
          <View style={{ marginHorizontal: 20, backgroundColor: T.badSoft, borderColor: T.bad, borderWidth: 1, borderRadius: T.rMd, padding: 14, marginBottom: 14 }}>
            <Text style={{ fontFamily: T.fontBody, color: T.badInk }}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={{ paddingTop: 60, alignItems: "center" }}>
            <ActivityIndicator color={T.teal} size="large" />
          </View>
        ) : (
          /* ── Map track ── */
          <View style={{ position: "relative", marginTop: 16 }}>
            {/* Center vertical line */}
            <View style={s.centerLine} />

            {REGION_DEF.map((region, i) => {
              const isLeft  = i % 2 === 0;
              const state   = nodeStates[region.id] ?? "locked";
              const scs     = regionScenarios[region.id] ?? [];
              const isOpen  = expandedId === region.id;
              const doneCnt = scs.filter((s) => s.completed).length;

              return (
                <View key={region.id}>
                  {/* Node row */}
                  <View style={s.nodeRow}>
                    {/* LEFT side */}
                    <View style={[s.half, { alignItems: isLeft ? "flex-end" : "flex-start" }]}>
                      {isLeft ? (
                        <TouchableOpacity
                          onPress={() => state !== "locked" && toggle(region.id)}
                          activeOpacity={state === "locked" ? 1 : 0.8}
                          style={{ alignItems: "flex-end" }}
                        >
                          <NodeCircle region={region} state={state} onPress={() => toggle(region.id)} />
                        </TouchableOpacity>
                      ) : (
                        <NodeMeta region={region} state={state} done={doneCnt} total={scs.length} isOpen={isOpen} onPress={() => state !== "locked" && toggle(region.id)} />
                      )}
                    </View>

                    {/* Center gap (line passes through here) */}
                    <View style={{ width: 32 }} />

                    {/* RIGHT side */}
                    <View style={[s.half, { alignItems: isLeft ? "flex-start" : "flex-end" }]}>
                      {isLeft ? (
                        <NodeMeta region={region} state={state} done={doneCnt} total={scs.length} isOpen={isOpen} onPress={() => state !== "locked" && toggle(region.id)} />
                      ) : (
                        <TouchableOpacity
                          onPress={() => state !== "locked" && toggle(region.id)}
                          activeOpacity={state === "locked" ? 1 : 0.8}
                          style={{ alignItems: "flex-start" }}
                        >
                          <NodeCircle region={region} state={state} onPress={() => toggle(region.id)} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Expanded panel (full width, below node) */}
                  {isOpen && state !== "locked" && (
                    <View style={{ paddingHorizontal: 20, marginTop: 4, marginBottom: 12 }}>
                      <RegionPanel
                        region={region}
                        scenarios={scs}
                        onClose={() => setExpandedId(null)}
                      />
                    </View>
                  )}

                  {/* Locked tooltip */}
                  {isOpen && state === "locked" && (
                    <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                      <View style={[s.panel, { borderColor: T.border, alignItems: "center", paddingVertical: 16 }]}>
                        <Text style={{ fontSize: 28, marginBottom: 6 }}>🔒</Text>
                        <Text style={{ fontFamily: T.fontHead, color: T.hudMuted, fontSize: 14 }}>Regija zaključana</Text>
                        <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
                          Završi prethodne regije da otključaš {region.name}.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Node meta (name + status label) ──────────────────────────────────────────

function NodeMeta({
  region, state, done, total, isOpen, onPress,
}: {
  region: Region; state: NodeState; done: number; total: number; isOpen: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={state !== "locked" ? onPress : undefined}
      activeOpacity={state === "locked" ? 1 : 0.7}
      style={{ maxWidth: 130 }}
    >
      <Text style={[s.nodeName, state === "locked" && { color: T.hudMuted, opacity: 0.5 }]}>{region.name}</Text>
      <Text style={s.nodeSub}>{region.sub}</Text>
      {state !== "locked" && total > 0 && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
          <View style={s.miniProg}>
            <View style={[s.miniProgFill, { width: `${(done / total) * 100}%` as any, backgroundColor: region.color }]} />
          </View>
          <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 10 }}>{done}/{total}</Text>
        </View>
      )}
      {state === "current" && (
        <View style={[s.statusChip, { borderColor: region.color, backgroundColor: region.glowColor }]}>
          <Text style={{ fontFamily: T.fontBody, color: region.color, fontSize: 10 }}>▶ Ovdje si</Text>
        </View>
      )}
      {state === "done" && (
        <View style={[s.statusChip, { borderColor: T.good, backgroundColor: T.goodSoft }]}>
          <Text style={{ fontFamily: T.fontBody, color: T.good, fontSize: 10 }}>✓ Završeno</Text>
        </View>
      )}
      {state !== "locked" && (
        <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11, marginTop: 4 }}>
          {isOpen ? "Zatvori ↑" : "Misije ↓"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  centerLine: {
    position: "absolute",
    left: "50%",
    top: 0, bottom: 0,
    width: 2,
    backgroundColor: T.hudStroke,
  },

  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  half: { flex: 1 },

  nodeCircle: {
    width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
    borderWidth: 2.5, borderColor: T.border,
    backgroundColor: T.panel,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },

  doneBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: T.good,
    borderWidth: 1.5, borderColor: T.bg,
    alignItems: "center", justifyContent: "center",
  },

  nodeName: { fontFamily: T.fontHead, color: T.hudInk, fontSize: 13.5, lineHeight: 18 },
  nodeSub:  { fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11, marginTop: 1 },

  statusChip: {
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
    marginTop: 6, alignSelf: "flex-start",
  },

  miniProg: { width: 50, height: 4, borderRadius: 2, backgroundColor: T.hudStroke, overflow: "hidden" },
  miniProgFill: { height: "100%", borderRadius: 2 },

  // Panel
  panel: {
    backgroundColor: T.panelDeep,
    borderRadius: T.rMd, borderWidth: 1.5,
    borderColor: T.border, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  panelTitle: { fontFamily: T.fontHead, fontSize: 16 },
  panelSub:   { fontFamily: T.fontBody, color: T.hudMuted, fontSize: 12, marginTop: 2 },

  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: T.hudBg, borderWidth: 1, borderColor: T.hudStroke,
    alignItems: "center", justifyContent: "center",
  },

  progBar: { height: 4, borderRadius: 2, backgroundColor: T.hudStroke, overflow: "hidden", marginTop: 4 },
  progFill: { height: "100%", borderRadius: 2 },

  scCard: {
    backgroundColor: T.panel, borderWidth: 1, borderColor: T.border,
    borderRadius: T.rSm, padding: 12, flexDirection: "row", alignItems: "stretch", gap: 8,
  },
  scTitle: { fontFamily: T.fontHead, color: T.hudInk, fontSize: 13.5, lineHeight: 20, marginTop: 2 },
  scCta:   { fontFamily: T.fontBody, fontSize: 12, marginTop: 6 },
  scXp:    { fontFamily: T.fontBodyXBold, color: T.sun, fontSize: 14 },
  scXpLabel:{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 10 },

  chip: {
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1,
  },
});
