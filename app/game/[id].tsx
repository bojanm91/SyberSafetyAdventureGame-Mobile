import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/auth-context";
import {
  apiGetScenario, apiGetScenarios, apiSubmitGameResult,
  type ScenarioDetail, type ScenarioSummary, type SubmitResultResponse,
} from "../../lib/api";
import { T } from "../../lib/theme";
import { getLocalCompletedScenarioIds, rememberLocalCompletedScenario } from "../../lib/local-progress";

import Odluka from "../../components/interactions/Odluka";
import PhishingInbox from "../../components/interactions/PhishingInbox";
import Lozinka from "../../components/interactions/Lozinka";
import Razvrstaj from "../../components/interactions/Razvrstaj";
import PravoLazno from "../../components/interactions/PravoLazno";
import Razgovor from "../../components/interactions/Razgovor";
import Podesi from "../../components/interactions/Podesi";
import BrziKrug from "../../components/interactions/BrziKrug";
import FeedbackSheet from "../../components/FeedbackSheet";

let BG_GAME: number | null = null;
try { BG_GAME = require("../../assets/images/bg_game.jpg"); } catch { BG_GAME = null; }

const DIFF_COLORS: Record<string, string> = {
  easy: T.good, medium: T.sun, hard: T.bad,
};
const DIFF_LABELS: Record<string, string> = {
  easy: "Lako", medium: "Srednje", hard: "Teško",
};

export default function GamePlayScreen() {
  const { user, updateUser }  = useAuth();
  const router                = useRouter();
  const insets                = useSafeAreaInsets();
  const { id }                = useLocalSearchParams<{ id: string }>();

  const [scenario,     setScenario]     = useState<ScenarioDetail | null>(null);
  const [discScenarios,setDiscScenarios]= useState<ScenarioSummary[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  const [answered,      setAnswered]      = useState(false);
  const [revealCorrect, setRevealCorrect] = useState(false);
  const [result,        setResult]        = useState<SubmitResultResponse | null>(null);
  const [startTime,    setStartTime]      = useState(Date.now());
  const [nextId,        setNextId]        = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    setLoading(true);
    setScenario(null);
    setDiscScenarios([]);
    setAnswered(false);
    setRevealCorrect(false);
    setResult(null);
    setNextId(null);
    setStartTime(Date.now());

    apiGetScenario(id)
      .then((sc) => {
        setScenario(sc);
        // Also fetch all scenarios for this discipline to compute next
        return apiGetScenarios(sc.discipline.slug);
      })
      .then(async (all) => {
        const localCompleted = await getLocalCompletedScenarioIds(user.id);
        setDiscScenarios(all.map((s) => (
          localCompleted.has(s.id) ? { ...s, completed: true } : s
        )));
      })
      .catch(() => setError("Scenarij nije pronađen."))
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  async function handleAnswer(correct: boolean, xpMultiplier: number) {
    if (!scenario || answered) return;
    setAnswered(true);
    setRevealCorrect(true);

    const timeMs  = Date.now() - startTime;
    const xpEarned = correct ? Math.round(scenario.xp * xpMultiplier) : 0;

    try {
      const res = await apiSubmitGameResult({ questId: scenario.id, correct, xpEarned, timeMs });
      setResult(res);
      let updatedScenarios = discScenarios;
      if (correct) {
        if (user) await rememberLocalCompletedScenario(user.id, scenario.id);
        updatedScenarios = discScenarios.map((s) => (
          s.id === scenario.id ? { ...s, completed: true } : s
        ));
        setDiscScenarios(updatedScenarios);
      }
      if (user && res.xpEarned > 0) {
        await updateUser({ ...user, points: res.xpTotal, level: res.newLevel, status: res.newRank, streak: res.streak });
      }
      // Determine next uncompleted scenario in same discipline
      if (correct) {
        const currentIndex = updatedScenarios.findIndex((s) => s.id === scenario.id);
        const afterCurrent = currentIndex >= 0 ? updatedScenarios.slice(currentIndex + 1) : updatedScenarios;
        const next = afterCurrent.find((s) => !s.completed) ?? null;
        setNextId(next?.id ?? null);
      } else {
        setNextId(null);
      }
    } catch {
      setResult({
        correct, xpEarned, leveledUp: false, newLevel: user?.level ?? 1,
        newRank: user?.status ?? "", xpTotal: user?.points ?? 0,
        xpToNextLevel: 0, streak: user?.streak ?? 0, earnedBadges: [],
      });
      let updatedScenarios = discScenarios;
      if (correct) {
        if (user) await rememberLocalCompletedScenario(user.id, scenario.id);
        updatedScenarios = discScenarios.map((s) => (
          s.id === scenario.id ? { ...s, completed: true } : s
        ));
        setDiscScenarios(updatedScenarios);
      }
      if (correct) {
        const currentIndex = updatedScenarios.findIndex((s) => s.id === scenario.id);
        const afterCurrent = currentIndex >= 0 ? updatedScenarios.slice(currentIndex + 1) : updatedScenarios;
        const next = afterCurrent.find((s) => !s.completed) ?? null;
        setNextId(next?.id ?? null);
      } else {
        setNextId(null);
      }
    }
  }

  function handleContinue() {
    if (nextId) {
      router.replace(`/game/${nextId}`);
    } else {
      // All done in this discipline → back to missions map
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/missions" as any);
    }
  }

  function handleRetry() {
    setAnswered(false);
    setRevealCorrect(false);
    setResult(null);
    setNextId(null);
  }

  // ── Loading / error ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={T.teal} size="large" />
        <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 13, marginTop: 12 }}>Učitavam scenarij…</Text>
      </View>
    );
  }

  if (error || !scenario) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 12 }}>
        <Text style={{ fontFamily: T.fontBody, color: T.bad, fontSize: 15, textAlign: "center" }}>{error || "Scenarij nije pronađen."}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ borderColor: T.border, borderWidth: 1, borderRadius: T.rMd, paddingHorizontal: 20, paddingVertical: 10 }}
        >
          <Text style={{ fontFamily: T.fontBody, color: T.teal, fontSize: 14 }}>← Nazad</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diffColor = DIFF_COLORS[scenario.difficulty] ?? T.hudMuted;

  // Progress through discipline (how many done out of total)
  const discTotal = discScenarios.length;
  const discDone  = discScenarios.filter((s) => s.completed).length;
  const discPct   = discTotal > 0 ? discDone / discTotal : 0;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Scene background */}
      {BG_GAME && (
        <Image
          source={BG_GAME}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 280, resizeMode: "cover", opacity: 0.22 }}
        />
      )}
      <LinearGradient
        colors={[T.scene1, "transparent"]}
        locations={[0, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 160 }}
      />
      <LinearGradient
        colors={["transparent", T.bg]}
        locations={[0, 1]}
        style={{ position: "absolute", top: 160, left: 0, right: 0, height: 120 }}
      />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: T.hudStroke,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14 }}>← Nazad</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Text style={{ fontSize: 14 }}>{scenario.discipline.icon}</Text>
            <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 12 }}>{scenario.discipline.name}</Text>
            <View style={{ backgroundColor: `${diffColor}22`, borderColor: `${diffColor}44`, borderWidth: 1, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontFamily: T.fontBody, color: diffColor, fontSize: 11 }}>{DIFF_LABELS[scenario.difficulty] ?? scenario.difficulty}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontFamily: T.fontBodyXBold, color: T.sun, fontSize: 13 }}>+{scenario.xp}</Text>
            <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11 }}>XP</Text>
          </View>
        </View>

        <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 18, lineHeight: 26 }}>
          {scenario.title}
        </Text>

        {/* Discipline progress bar */}
        {discTotal > 0 && (
          <View style={{ marginTop: 10, gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Napredak — {scenario.discipline.name}
              </Text>
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 10 }}>{discDone}/{discTotal}</Text>
            </View>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: T.hudStroke, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${discPct * 100}%`, borderRadius: 2, backgroundColor: T.teal }} />
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Scenario text */}
        {!result && (
          <View style={{
            backgroundColor: T.panelDeep, borderColor: T.hudStroke, borderWidth: 1,
            borderRadius: T.rMd, padding: 16, marginBottom: 16,
          }}>
            <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Scenarij</Text>
            <Text style={{ fontFamily: T.fontBody, color: T.hudInk, fontSize: 15, lineHeight: 24 }}>{scenario.tekst}</Text>
          </View>
        )}

        {/* Interaction OR feedback */}
        {result ? (
          <FeedbackSheet
            correct={result.correct}
            xpEarned={result.xpEarned}
            xpTotal={result.xpTotal}
            objasnjenje={scenario.objasnjenje}
            leveledUp={result.leveledUp}
            newLevel={result.newLevel}
            newRank={result.newRank}
            earnedBadges={result.earnedBadges}
            hasNext={!!nextId}
            onContinue={handleContinue}
            onRetry={!result.correct ? handleRetry : undefined}
          />
        ) : (
          renderInteraction(scenario, answered, revealCorrect, handleAnswer)
        )}
      </ScrollView>
    </View>
  );
}

function renderInteraction(
  scenario: ScenarioDetail,
  answered: boolean,
  revealCorrect: boolean,
  onAnswer: (correct: boolean, xpMultiplier: number) => void,
) {
  const props = { gameData: scenario.gameData as any, correctData: scenario.correctData as any, onAnswer, answered, revealCorrect };
  switch (scenario.interactionType) {
    case "odluka":         return <Odluka {...props} />;
    case "phishing_inbox": return <PhishingInbox {...props} />;
    case "lozinka":        return <Lozinka {...props} />;
    case "razvrstaj":      return <Razvrstaj {...props} />;
    case "pravo_lazno":    return <PravoLazno {...props} />;
    case "razgovor":       return <Razgovor {...props} />;
    case "podesi":         return <Podesi {...props} />;
    case "brzi_krug":      return <BrziKrug {...props} />;
    default:
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ fontFamily: T.fontBody, color: T.bad }}>Nepoznat tip: {scenario.interactionType}</Text>
        </View>
      );
  }
}
