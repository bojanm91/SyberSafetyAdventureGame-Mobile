import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/auth-context";
import { apiGetScenario, apiSubmitGameResult, type ScenarioDetail, type SubmitResultResponse } from "../../lib/api";

import Odluka from "../../components/interactions/Odluka";
import PhishingInbox from "../../components/interactions/PhishingInbox";
import Lozinka from "../../components/interactions/Lozinka";
import Razvrstaj from "../../components/interactions/Razvrstaj";
import PravoLazno from "../../components/interactions/PravoLazno";
import Razgovor from "../../components/interactions/Razgovor";
import Podesi from "../../components/interactions/Podesi";
import BrziKrug from "../../components/interactions/BrziKrug";
import FeedbackSheet from "../../components/FeedbackSheet";

const DIFF_COLORS: Record<string, string> = {
  easy: "#34D399",
  medium: "#FBBF24",
  hard: "#F87171",
};
const DIFF_LABELS: Record<string, string> = {
  easy: "Lako", medium: "Srednje", hard: "Teško",
};

export default function GamePlayScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [answered, setAnswered] = useState(false);
  const [revealCorrect, setRevealCorrect] = useState(false);
  const [result, setResult] = useState<SubmitResultResponse | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!id) return;
    apiGetScenario(id)
      .then(setScenario)
      .catch(() => setError("Scenarij nije pronađen."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAnswer(correct: boolean, xpMultiplier: number) {
    if (!scenario || answered) return;
    setAnswered(true);
    setRevealCorrect(true);

    const timeMs = Date.now() - startTime;
    const xpEarned = correct ? Math.round(scenario.xp * xpMultiplier) : 0;

    try {
      const res = await apiSubmitGameResult({ questId: scenario.id, correct, xpEarned, timeMs });
      setResult(res);
      if (user && correct && res.xpEarned > 0) {
        await updateUser({
          ...user,
          points: res.xpTotal,
          level: res.newLevel,
          status: res.newRank,
          streak: res.streak,
        });
      }
    } catch {
      // still show feedback even if network fails
      setResult({
        correct, xpEarned, leveledUp: false, newLevel: user?.level ?? 1,
        newRank: user?.status ?? "", xpTotal: user?.points ?? 0,
        xpToNextLevel: 0, streak: user?.streak ?? 0, earnedBadges: [],
      });
    }
  }

  function handleContinue() {
    router.back();
  }

  function handleRetry() {
    setAnswered(false);
    setRevealCorrect(false);
    setResult(null);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B0F1A", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#22D3EE" size="large" />
        <Text style={{ color: "#8A97AD", fontSize: 13, marginTop: 12 }}>Učitavam scenarij...</Text>
      </View>
    );
  }

  if (error || !scenario) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B0F1A", alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 12 }}>
        <Text style={{ color: "#F87171", fontSize: 15, textAlign: "center" }}>{error || "Scenarij nije pronađen."}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ borderColor: "rgba(34,211,238,0.25)", borderWidth: 1, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10 }}
        >
          <Text style={{ color: "#22D3EE", fontSize: 14 }}>← Nazad</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diffColor = DIFF_COLORS[scenario.difficulty] ?? "#8A97AD";

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#0B0F1A", borderBottomWidth: 1, borderBottomColor: "#26304A" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Text style={{ color: "#8A97AD", fontSize: 14 }}>← Nazad</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Text style={{ color: scenario.discipline.icon, fontSize: 16 }}>{scenario.discipline.icon}</Text>
            <Text style={{ color: "#8A97AD", fontSize: 12 }}>{scenario.discipline.name}</Text>
            <View style={{ backgroundColor: `${diffColor}22`, borderColor: `${diffColor}44`, borderWidth: 1, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: diffColor, fontSize: 11, fontWeight: "700" }}>{DIFF_LABELS[scenario.difficulty] ?? scenario.difficulty}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: "#22D3EE", fontSize: 13, fontWeight: "700" }}>+{scenario.xp}</Text>
            <Text style={{ color: "#8A97AD", fontSize: 11 }}>XP</Text>
          </View>
        </View>

        <Text style={{ color: "#E5ECF5", fontSize: 18, fontWeight: "700", marginTop: 10, lineHeight: 26 }}>
          {scenario.title}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Scenario text */}
        {!result && (
          <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: "#8A97AD", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Scenarij</Text>
            <Text style={{ color: "#E5ECF5", fontSize: 15, lineHeight: 24 }}>{scenario.tekst}</Text>
          </View>
        )}

        {/* Interaction component OR feedback */}
        {result ? (
          <FeedbackSheet
            correct={result.correct}
            xpEarned={result.xpEarned}
            objasnjenje={scenario.objasnjenje}
            leveledUp={result.leveledUp}
            newLevel={result.newLevel}
            newRank={result.newRank}
            earnedBadges={result.earnedBadges}
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
  const props = {
    gameData: scenario.gameData as any,
    correctData: scenario.correctData as any,
    onAnswer,
    answered,
    revealCorrect,
  };

  switch (scenario.interactionType) {
    case "odluka":
      return <Odluka {...props} />;
    case "phishing_inbox":
      return <PhishingInbox {...props} />;
    case "lozinka":
      return <Lozinka {...props} />;
    case "razvrstaj":
      return <Razvrstaj {...props} />;
    case "pravo_lazno":
      return <PravoLazno {...props} />;
    case "razgovor":
      return <Razgovor {...props} />;
    case "podesi":
      return <Podesi {...props} />;
    case "brzi_krug":
      return <BrziKrug {...props} />;
    default:
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: "#F87171" }}>Nepoznat tip interakcije: {scenario.interactionType}</Text>
        </View>
      );
  }
}
