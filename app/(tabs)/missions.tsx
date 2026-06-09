import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Image, Dimensions, Animated,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../contexts/auth-context";
import type { ScenarioSummary } from "../../lib/api";
import { T } from "../../lib/theme";
import { getMergedScenarios } from "../../lib/mission-progress";
import { isPushEnabled, wasPushPromptAnswered } from "../../lib/notifications";
import PushPermissionPrompt from "../../components/PushPermissionPrompt";

// Subtle atmospheric backdrop — drawn behind a heavy dark wash so it reads as
// texture only (the route itself is drawn in <StoryRoute/>, not in the image).
let BG_MAP: number | null = null;
try { BG_MAP = require("../../assets/images/bg_mracko.jpg"); } catch { BG_MAP = null; }

const REGION_IMAGES: Record<string, number | null> = {
  akademija: null,
  luka_lozinki: require("../../assets/images/bg_password_harbor.jpg"),
  mocvara: require("../../assets/images/bg_phishing_swamp.jpg"),
  tvrdjava: require("../../assets/images/bg_privacy_fortress.jpg"),
  pecine: require("../../assets/images/bg_malware_caves.jpg"),
  citadela: require("../../assets/images/bg_final_citadel.jpg"),
};

const { width: W } = Dimensions.get("window");

// ── Layout constants ──────────────────────────────────────────────────────────

const NODE_COUNT = 6; // Citadela (top) … Akademija (bottom)
const NODE_SZ    = 62;
const SECTION_H  = 160;

// The route is drawn by us, so the node positions are laid out on a comfortable
// vertical rhythm and the map height follows from them.
const ROUTE_TOP = 150;
const ROUTE_GAP = 186;
const ROUTE_BOT = 130;
const MAP_H = ROUTE_TOP + (NODE_COUNT - 1) * ROUTE_GAP + ROUTE_BOT;

// Gentle serpentine: top & bottom nodes centred, the middle ones weave L/R.
const CX  = W / 2;
const AMP = Math.min(86, W * 0.22);
const SERP = [0, 1, -1, 1, -1, 0]; // × AMP, index 0 = Citadela (top)
const NODE_CX = SERP.map((s) => CX + s * AMP);
const NODE_Y  = Array.from({ length: NODE_COUNT }, (_, i) => ROUTE_TOP + i * ROUTE_GAP);

// Centre of a node's circle (the route threads through these points).
const NODE_PTS = NODE_CX.map((x, i) => ({ x, y: NODE_Y[i] + NODE_SZ / 2 }));

// Build a smooth Catmull-Rom curve (as cubic-bezier SVG segments) through pts.
// Each segment keeps its path string and an approximate length (for the
// draw-in unlock animation via strokeDashoffset).
type RouteSeg = { d: string; length: number };

function buildRoute(pts: Array<{ x: number; y: number }>): RouteSeg[] {
  const segs: RouteSeg[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    // Approximate arc length by sampling the cubic Bézier.
    let len = 0, px = p1.x, py = p1.y;
    for (let s = 1; s <= 24; s++) {
      const t = s / 24, mt = 1 - t;
      const x = mt * mt * mt * p1.x + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * p2.x;
      const y = mt * mt * mt * p1.y + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * p2.y;
      len += Math.hypot(x - px, y - py);
      px = x; py = y;
    }
    segs.push({ d: `M${p1.x},${p1.y} C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`, length: len });
  }
  return segs;
}
const ROUTE = buildRoute(NODE_PTS);

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ── Region definitions ────────────────────────────────────────────────────────

type NodeState = "done" | "current" | "locked";

const REGION_DEF = [
  { id: "citadela",     name: "Citadela",         sub: "Finale",             icon: "✦",  bg: ["#3D2C00","#1A1200"] as [string,string], accent: T.sun,     discSlugs: [] as string[] },
  { id: "pecine",       name: "Pećine Malvera",    sub: "Malver & virusi",    icon: "☣",  bg: ["#2A1040","#0F0820"] as [string,string], accent: "#9B6ED4", discSlugs: ["malver","malware","virusi"] },
  { id: "tvrdjava",     name: "Tvrđava Baze",      sub: "Privatnost & Wi-Fi", icon: "🔒", bg: ["#0B1E3A","#060F1E"] as [string,string], accent: T.primary, discSlugs: ["privatnost","podaci","dvofaktorska","azuriranja","sigurno-preuzimanje","javni-wifi"] },
  { id: "mocvara",      name: "Močvara Phishinga", sub: "Phishing & prevare", icon: "🎣", bg: ["#0D2818","#060E0B"] as [string,string], accent: "#4CAF82", discSlugs: ["phishing","socijalni-inzenjering","prevare","phishing_inbox"] },
  { id: "luka_lozinki", name: "Luka Lozinki",      sub: "Lozinke",            icon: "⚓",  bg: ["#062830","#020E12"] as [string,string], accent: T.teal,    discSlugs: ["lozinke","lozinka"] },
  { id: "akademija",    name: "Akademija",          sub: "Početak putanje",    icon: "★",  bg: ["#2A1A08","#0E0805"] as [string,string], accent: T.coral,   discSlugs: ["uvod","osnove","akademija"] },
] as const;

type Region = typeof REGION_DEF[number];

const DIFF_COLOR: Record<string, string> = { easy: T.good, medium: T.sun, hard: T.bad };
const DIFF_LABEL: Record<string, string> = { easy: "Lako", medium: "Srednje", hard: "Teško" };

function mapToRegionId(slug: string): string {
  for (const r of REGION_DEF) {
    if ((r.discSlugs as readonly string[]).includes(slug)) return r.id;
  }
  return "tvrdjava";
}

function computeStates(regionScenarios: Record<string, ScenarioSummary[]>): Record<string, NodeState> {
  const states: Record<string, NodeState> = {};
  let firstCurrentSet = false;
  for (let i = REGION_DEF.length - 1; i >= 0; i--) {
    const r   = REGION_DEF[i];
    const scs = regionScenarios[r.id] ?? [];
    if (r.id === "akademija" && scs.length === 0) {
      states[r.id] = "done";
    } else if (scs.length === 0)             states[r.id] = "locked";
    else if (scs.every((s) => s.completed)) states[r.id] = "done";
    else if (!firstCurrentSet)             { states[r.id] = "current"; firstCurrentSet = true; }
    else                                   states[r.id] = "locked";
  }
  return states;
}

// A segment is lit when the node it leads *up to* (index i, closer to the
// finale) has been reached — so the gold trail stops exactly at the current
// node and everything beyond stays dim/locked.
function segmentLit(states: Record<string, NodeState>, i: number): boolean {
  return states[REGION_DEF[i].id] !== "locked";
}

function StoryRoute({ states, animSeg }: { states: Record<string, NodeState>; animSeg: number }) {
  // animSeg = index of the segment that just unlocked (draw it in), or -1.
  const draw = useRef(new Animated.Value(1)).current; // 1 = hidden, 0 = fully drawn

  useEffect(() => {
    if (animSeg >= 0) {
      draw.setValue(1);
      Animated.timing(draw, {
        toValue: 0, duration: 1000, useNativeDriver: false,
      }).start();
    }
  }, [animSeg]);

  return (
    <Svg width={W} height={MAP_H} style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dim base track (whole route) */}
      {ROUTE.map((seg, i) => (
        <Path
          key={`track-${i}`}
          d={seg.d}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={13}
          strokeLinecap="round"
          fill="none"
        />
      ))}

      {/* Lit (unlocked) portions — soft glow under a bright core */}
      {ROUTE.map((seg, i) => {
        if (!segmentLit(states, i)) return null;
        if (i === animSeg) {
          // Draw-in animation for the freshly unlocked segment.
          const offset = draw.interpolate({ inputRange: [0, 1], outputRange: [0, seg.length] });
          return (
            <Fragment key={`lit-${i}`}>
              <Path d={seg.d} stroke="rgba(250,199,117,0.22)" strokeWidth={16} strokeLinecap="round" fill="none" />
              <AnimatedPath
                d={seg.d}
                stroke="rgba(250,199,117,0.95)"
                strokeWidth={6}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${seg.length}, ${seg.length}`}
                strokeDashoffset={offset}
              />
            </Fragment>
          );
        }
        return (
          <Fragment key={`lit-${i}`}>
            <Path d={seg.d} stroke="rgba(250,199,117,0.22)" strokeWidth={16} strokeLinecap="round" fill="none" />
            <Path d={seg.d} stroke="rgba(250,199,117,0.95)" strokeWidth={6} strokeLinecap="round" fill="none" />
          </Fragment>
        );
      })}
    </Svg>
  );
}

// ── Map node ──────────────────────────────────────────────────────────────────

function MapNode({ region, state, done, total, onPress, cx, cy, celebrate }: {
  region: Region; state: NodeState; done: number; total: number;
  onPress: () => void; cx: number; cy: number; celebrate?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ringAnim  = useRef(new Animated.Value(0)).current;
  const isCurrent = state === "current";
  const isDone    = state === "done";
  const isLocked  = state === "locked";
  const accent    = isLocked ? "rgba(255,255,255,0.14)" : region.accent;

  useEffect(() => {
    if (isCurrent) {
      Animated.loop(Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.13, duration: 900, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0,  duration: 900, useNativeDriver: true }),
      ])).start();
    } else {
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
    }
  }, [isCurrent]);

  // One-time celebratory "unlock" burst: a quick pop + an expanding ring.
  useEffect(() => {
    if (!celebrate) return;
    scaleAnim.setValue(0.7);
    ringAnim.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.18, friction: 4, tension: 80, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1.0,  friction: 5, tension: 60, useNativeDriver: true }),
      ]),
      Animated.timing(ringAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start();
  }, [celebrate]);

  // Container is 130px wide, centered on cx
  return (
    <View style={{ position: "absolute", left: cx - 65, top: cy, width: 130, alignItems: "center", zIndex: 3 }}>
      {/* Expanding unlock ring */}
      {celebrate && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute", top: 0,
            width: NODE_SZ, height: NODE_SZ, borderRadius: NODE_SZ / 2,
            borderWidth: 2, borderColor: region.accent,
            opacity: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
            transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
          }}
        />
      )}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={isLocked ? undefined : onPress}
          activeOpacity={isLocked ? 1 : 0.72}
          style={{
            width: NODE_SZ, height: NODE_SZ, borderRadius: NODE_SZ / 2,
            backgroundColor: isLocked ? "rgba(8,14,26,0.9)" : `${accent}22`,
            borderWidth: 3,
            borderColor: isLocked ? "rgba(255,255,255,0.1)" : isDone ? accent : `${accent}75`,
            alignItems: "center", justifyContent: "center",
            shadowColor: isLocked ? "transparent" : accent,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: isCurrent ? 20 : isDone ? 12 : 0,
            shadowOpacity: isCurrent ? 1 : isDone ? 0.7 : 0,
            elevation: isCurrent ? 14 : isDone ? 8 : 1,
          }}
        >
          <Text style={{ fontSize: 28, opacity: isLocked ? 0.22 : 1 }}>
            {isLocked ? "🔒" : isDone ? "✅" : region.icon}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Label chip */}
      <View style={{
        marginTop: 8,
        backgroundColor: "rgba(5,10,22,0.88)",
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: isLocked ? "rgba(255,255,255,0.07)" : `${accent}30`,
        paddingHorizontal: 10, paddingVertical: 5,
        width: 122, alignItems: "center",
      }}>
        <Text style={{
          fontFamily: T.fontHead, fontSize: 11,
          color: isLocked ? "#374151" : T.hudInk,
          textAlign: "center",
        }} numberOfLines={1}>{region.name}</Text>
        <Text style={{
          fontFamily: T.fontBody, fontSize: 10,
          color: isCurrent ? accent : T.hudMuted,
          marginTop: 1,
        }}>
          {isLocked ? "Zaključano" : isCurrent ? "▶ Ovdje si" : total === 0 ? "Start" : `${done}/${total}`}
        </Text>
      </View>
    </View>
  );
}

// ── Mission bottom sheet ──────────────────────────────────────────────────────

function MissionPanel({ region, scenarios, state, onClose, onPlay }: {
  region: Region; scenarios: ScenarioSummary[]; state: NodeState;
  onClose: () => void; onPlay: (id: string) => void;
}) {
  const insets    = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 58, friction: 11, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  function dismiss() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 220, useNativeDriver: true }),
    ]).start(onClose);
  }

  const done  = scenarios.filter((s) => s.completed).length;
  const total = scenarios.length;
  const pct   = total > 0 ? done / total : 0;
  const regionImage = REGION_IMAGES[region.id];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Scrim */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.65)", opacity: fadeAnim }]}
        pointerEvents="auto"
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={dismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          maxHeight: "80%",
          backgroundColor: "#0A1020",
          borderTopLeftRadius: 26, borderTopRightRadius: 26,
          borderTopWidth: 2, borderLeftWidth: 1, borderRightWidth: 1,
          borderColor: `${region.accent}40`,
          paddingBottom: insets.bottom + 8,
          transform: [{ translateY: slideAnim }],
          shadowColor: region.accent,
          shadowRadius: 28, shadowOpacity: 0.3, elevation: 28,
        }}
      >
        {/* Handle */}
        <View style={{ alignItems: "center", paddingTop: 14, paddingBottom: 4 }}>
          <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: `${region.accent}55` }} />
        </View>

        {/* Region header */}
        <LinearGradient
          colors={[...region.bg, "transparent"] as [string, string, string]}
          style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, overflow: "hidden" }}
        >
          {regionImage ? (
            <>
              <Image
                source={regionImage}
                style={{ position: "absolute", top: 0, left: 0, right: 0, height: 158, width: "100%", resizeMode: "cover", opacity: 0.32 }}
              />
              <LinearGradient
                colors={["rgba(10,16,32,0.35)", "#0A1020"]}
                style={{ position: "absolute", top: 0, left: 0, right: 0, height: 158 }}
              />
            </>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{
              width: 54, height: 54, borderRadius: 18,
              backgroundColor: `${region.accent}22`, borderWidth: 2, borderColor: `${region.accent}55`,
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 26 }}>{state === "locked" ? "🔒" : region.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 20 }}>{region.name}</Text>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 12, marginTop: 2 }}>{region.sub}</Text>
            </View>
            <TouchableOpacity onPress={dismiss} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              <Text style={{ color: T.hudMuted, fontSize: 22 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {total > 0 && (
            <View style={{ marginTop: 14 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${pct * 100}%`, borderRadius: 3, backgroundColor: region.accent }} />
              </View>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11, marginTop: 5 }}>
                {done}/{total} misija završeno
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Missions list */}
        <ScrollView
          style={{ flexShrink: 1 }}
          contentContainerStyle={{ padding: 14, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {state === "locked" ? (
            <View style={{ alignItems: "center", paddingVertical: 32, gap: 10 }}>
              <Text style={{ fontSize: 38 }}>🔒</Text>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14, textAlign: "center", lineHeight: 22 }}>
                Završi prethodne regije da otključaš ovu oblast.
              </Text>
            </View>
          ) : scenarios.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14 }}>Nema misija u ovoj regiji.</Text>
            </View>
          ) : (
            scenarios.map((sc, idx) => {
              const diff = DIFF_COLOR[sc.difficulty];
              return (
                <TouchableOpacity
                  key={sc.id}
                  onPress={() => onPlay(sc.id)}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 14,
                    backgroundColor: sc.completed ? "rgba(22,148,102,0.07)" : T.panel,
                    borderWidth: 1.5,
                    borderColor: sc.completed ? "rgba(22,148,102,0.3)" : T.border,
                    borderRadius: T.rMd, padding: 14,
                  }}
                >
                  {/* Number / done badge */}
                  <View style={{
                    width: 40, height: 40, borderRadius: 14,
                    backgroundColor: sc.completed ? T.good : `${region.accent}22`,
                    borderWidth: 1.5, borderColor: sc.completed ? T.good : `${region.accent}55`,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ fontFamily: T.fontBodyXBold, color: sc.completed ? "#fff" : region.accent, fontSize: 15 }}>
                      {sc.completed ? "✓" : String(idx + 1)}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 14.5, lineHeight: 20 }}>
                      {sc.title}
                    </Text>
                    {diff && (
                      <View style={{ flexDirection: "row", marginTop: 4 }}>
                        <View style={{ borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: `${diff}40`, backgroundColor: `${diff}12` }}>
                          <Text style={{ fontFamily: T.fontBody, color: diff, fontSize: 10 }}>{DIFF_LABEL[sc.difficulty] ?? sc.difficulty}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: T.fontBodyXBold, color: T.sun, fontSize: 15 }}>+{sc.xp}</Text>
                    <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 10 }}>XP</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MissionsScreen() {
  const { user }   = useAuth();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const scrollRef  = useRef<ScrollView>(null);

  const [scenarios,  setScenarios]  = useState<ScenarioSummary[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [animSeg,    setAnimSeg]    = useState(-1); // segment to draw-in on unlock
  const [celebrateIdx, setCelebrateIdx] = useState(-1); // node that just unlocked
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  const loadScenarios = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    getMergedScenarios(user.id)
      .then(setScenarios)
      .catch(() => setError("Nije moguće učitati misije."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useFocusEffect(loadScenarios);

  // Scroll to Akademija (bottom = start of journey) on first load
  useEffect(() => {
    if (!loading) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 80);
    }
  }, [loading]);

  // Detect when the journey advances and play the unlock animation on the
  // freshly reached node + the segment leading into it.
  useEffect(() => {
    if (loading || !user) return;
    const rs: Record<string, ScenarioSummary[]> = {};
    for (const r of REGION_DEF) rs[r.id] = [];
    for (const sc of scenarios) (rs[mapToRegionId(sc.discipline.slug)] ??= []).push(sc);
    const states = computeStates(rs);
    const curIdx = REGION_DEF.findIndex((r) => states[r.id] === "current");
    if (curIdx < 0) return;

    const key = `byte_progress_${user.id}`;
    let cancelled = false;
    AsyncStorage.getItem(key).then((prev) => {
      if (cancelled) return;
      // Smaller index = further along the journey (idx 0 = finale).
      if (prev != null && curIdx < parseInt(prev, 10)) {
        setAnimSeg(curIdx);
        setCelebrateIdx(curIdx);
        setTimeout(() => { setAnimSeg(-1); setCelebrateIdx(-1); }, 1600);
      }
      void AsyncStorage.setItem(key, String(curIdx));
    });
    return () => { cancelled = true; };
  }, [loading, scenarios, user?.id]);

  const regionScenarios: Record<string, ScenarioSummary[]> = {};
  for (const r of REGION_DEF) regionScenarios[r.id] = [];
  for (const sc of scenarios) {
    const rId = mapToRegionId(sc.discipline.slug);
    (regionScenarios[rId] ??= []).push(sc);
  }

  const nodeStates = computeStates(regionScenarios);
  const totalDone  = scenarios.filter((s) => s.completed).length;
  const totalCount = scenarios.length;
  const selectedRegion = selectedId ? REGION_DEF.find((r) => r.id === selectedId) ?? null : null;

  async function handleRegionPress(region: Region) {
    setSelectedId(region.id);
    if (!user || region.id !== "luka_lozinki" || nodeStates[region.id] === "locked") return;

    const [enabled, answered] = await Promise.all([
      isPushEnabled(user.id).catch(() => false),
      wasPushPromptAnswered(user.id).catch(() => true),
    ]);
    if (!enabled && !answered) {
      setTimeout(() => setShowPushPrompt(true), 320);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#060B18" }}>
      {/* Floating HUD */}
      <LinearGradient
        colors={["rgba(6,11,24,0.96)", "rgba(6,11,24,0.55)", "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top + 90, zIndex: 10 }}
        pointerEvents="none"
      />
      <View style={{
        position: "absolute", top: insets.top + 10, left: 18, right: 18, zIndex: 11,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      }} pointerEvents="none">
        <View>
          <Text style={{ fontFamily: T.fontBody, color: T.mint, fontSize: 10, textTransform: "uppercase", letterSpacing: 2.5 }}>
            Sajber Mreža
          </Text>
          <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 26, marginTop: 1 }}>Mapa</Text>
        </View>
        {totalCount > 0 && (
          <View style={{
            backgroundColor: "rgba(8,15,30,0.88)", borderWidth: 1.5, borderColor: T.hudStroke,
            borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: "center",
          }}>
            <Text style={{ fontFamily: T.fontBodyXBold, color: T.sun, fontSize: 16 }}>{totalDone}/{totalCount}</Text>
            <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>misija</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={T.teal} size="large" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ height: MAP_H }}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtle atmospheric backdrop (texture only, heavily dimmed) */}
          {BG_MAP && (
            <Image
              source={BG_MAP}
              style={{ position: "absolute", top: 0, left: 0, width: W, height: MAP_H, resizeMode: "cover", opacity: 0.18 }}
            />
          )}

          {/* Top & bottom dark fades */}
          <LinearGradient
            colors={["#060B18", "transparent"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 110 }}
          />
          <LinearGradient
            colors={["transparent", "#060B18"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90 }}
          />

          {/* Per-region zone color overlays */}
          {REGION_DEF.map((r, i) => (
            <LinearGradient
              key={r.id + "_zone"}
              colors={[`${r.accent}00`, `${r.accent}0F`, `${r.accent}00`] as [string, string, string]}
              style={{
                position: "absolute",
                top: NODE_Y[i] - 70, left: 0, right: 0,
                height: SECTION_H,
              }}
            />
          ))}

          <StoryRoute states={nodeStates} animSeg={animSeg} />

          {/* Region nodes */}
          {REGION_DEF.map((r, i) => (
            <MapNode
              key={r.id}
              region={r}
              state={nodeStates[r.id] ?? "locked"}
              done={(regionScenarios[r.id] ?? []).filter((s) => s.completed).length}
              total={(regionScenarios[r.id] ?? []).length}
              cx={NODE_CX[i]}
              cy={NODE_Y[i]}
              celebrate={celebrateIdx === i}
              onPress={() => void handleRegionPress(r)}
            />
          ))}
        </ScrollView>
      )}

      {/* Mission bottom sheet */}
      {selectedRegion && (
        <MissionPanel
          region={selectedRegion}
          scenarios={regionScenarios[selectedRegion.id] ?? []}
          state={nodeStates[selectedRegion.id] ?? "locked"}
          onClose={() => setSelectedId(null)}
          onPlay={(id) => { setSelectedId(null); router.push(`/game/${id}`); }}
        />
      )}

      {error ? (
        <View style={{
          position: "absolute", bottom: insets.bottom + 16, left: 16, right: 16,
          backgroundColor: T.badSoft, borderColor: T.bad, borderWidth: 1,
          borderRadius: T.rMd, padding: 14,
        }}>
          <Text style={{ fontFamily: T.fontBody, color: T.badInk }}>{error}</Text>
        </View>
      ) : null}

      {showPushPrompt ? (
        <PushPermissionPrompt
          onDone={() => setShowPushPrompt(false)}
          title="Želiš obavještenja iz Luke Lozinki?"
          body="Bajt može da ti pošalje podsjetnik za nastavak misije, dnevni izazov ili kratak cyber savjet kada se ne vratiš neko vrijeme."
        />
      ) : null}
    </View>
  );
}
