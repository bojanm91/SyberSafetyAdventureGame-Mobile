import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/auth-context";
import { apiGetQuest, apiSubmitAnswer, type QuestDetail, type SubmitResult } from "../../lib/api";

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Lako", medium: "Srednje", hard: "Teško",
};

const DIFFICULTY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  easy: { text: "#13d18a", border: "rgba(19,209,138,0.2)", bg: "rgba(19,209,138,0.1)" },
  medium: { text: "#f5b942", border: "rgba(245,185,66,0.2)", bg: "rgba(245,185,66,0.1)" },
  hard: { text: "#ef5da8", border: "rgba(239,93,168,0.2)", bg: "rgba(239,93,168,0.1)" },
};

export default function QuestScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [quest, setQuest] = useState<QuestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    setLoading(true);
    apiGetQuest(id)
      .then((q) => {
        setQuest(q);
        if (q.userProgress) setSelectedOptionId(q.userProgress.correctOptionId);
      })
      .catch(() => setError("Quest nije pronađen."))
      .finally(() => setLoading(false));
  }, [user, id]);

  async function handleSubmit() {
    if (!selectedOptionId || !quest || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiSubmitAnswer(quest.id, selectedOptionId, usedHint);
      setResult(res);
      updateUser({
        id: user!.id,
        username: user!.username,
        email: user!.email,
        status: res.user.status,
        level: res.user.level,
        points: res.user.points,
        streak: res.user.streak,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri slanju odgovora.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#37d6ff" size="large" />
      </View>
    );
  }

  if (error || !quest) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-6 gap-4">
        <Text className="text-rose text-base text-center">{error || "Quest nije pronađen."}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-cyan text-sm">← Nazad na misije</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const alreadyCompleted = !!quest.userProgress;
  const isAnswered = !!result || alreadyCompleted;
  const correctId = result?.correctOptionId ?? quest.userProgress?.correctOptionId ?? null;
  const diffCfg = DIFFICULTY_COLORS[quest.difficulty];

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}
    >
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="flex-row items-center gap-2 mb-6"
      >
        <Text className="text-slate-400 text-sm">← Nazad</Text>
        {diffCfg && (
          <View style={{ borderColor: diffCfg.border, backgroundColor: diffCfg.bg }} className="border rounded-full px-2.5 py-0.5 ml-2">
            <Text style={{ color: diffCfg.text }} className="text-[11px] font-semibold">
              {DIFFICULTY_LABELS[quest.difficulty] ?? quest.difficulty}
            </Text>
          </View>
        )}
        <Text className="text-slate-400 text-sm">{quest.discipline.name}</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text className="text-violet/75 text-xs uppercase tracking-widest">
        {quest.discipline.icon} {quest.discipline.name}
      </Text>
      <Text className="text-white text-2xl font-bold mt-1 mb-0.5">{quest.title}</Text>
      <Text className="text-slate-500 text-sm mb-6">Do {quest.basePoints + 25} bodova</Text>

      {/* Scenario */}
      <View className="bg-panel border border-white/10 rounded-2xl p-5 mb-5">
        <Text className="text-slate-500 text-xs uppercase tracking-widest mb-2">Scenario</Text>
        <Text className="text-slate-300 text-base leading-7">{quest.scenario}</Text>
      </View>

      {/* Task */}
      <Text className="text-white text-lg font-semibold mb-5">{quest.taskText}</Text>

      {/* Options */}
      <View className="gap-3 mb-5">
        {[...quest.options]
          .sort((a, b) => a.order - b.order)
          .map((opt, idx) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = correctId === opt.id;
            const isWrong = isAnswered && isSelected && !isCorrect;

            let borderColor = "rgba(255,255,255,0.1)";
            let bgColor = "rgba(255,255,255,0.05)";
            let circleColor = "#475569";
            let circleText = String.fromCharCode(65 + idx);

            if (!isAnswered && isSelected) {
              borderColor = "rgba(55,214,255,0.4)";
              bgColor = "rgba(55,214,255,0.1)";
              circleColor = "#37d6ff";
            } else if (isAnswered && isCorrect) {
              borderColor = "rgba(19,209,138,0.4)";
              bgColor = "rgba(19,209,138,0.1)";
              circleColor = "#13d18a";
              circleText = "✓";
            } else if (isWrong) {
              borderColor = "rgba(239,93,168,0.4)";
              bgColor = "rgba(239,93,168,0.1)";
              circleColor = "#ef5da8";
              circleText = "✗";
            }

            return (
              <TouchableOpacity
                key={opt.id}
                disabled={isAnswered}
                onPress={() => !isAnswered && setSelectedOptionId(opt.id)}
                style={{ borderColor, backgroundColor: bgColor, opacity: isAnswered && !isCorrect && !isWrong ? 0.5 : 1 }}
                className="border rounded-2xl p-4"
              >
                <View className="flex-row items-start gap-3">
                  <View
                    style={{ borderColor: circleColor, backgroundColor: isAnswered && isCorrect ? "#13d18a" : isWrong ? "#ef5da8" : isSelected ? "#37d6ff" : "transparent" }}
                    className="w-6 h-6 rounded-full border-2 items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <Text style={{ color: isAnswered && (isCorrect || isWrong || isSelected) ? "#04111f" : circleColor }} className="text-xs font-bold">
                      {circleText}
                    </Text>
                  </View>
                  <Text className="text-slate-200 text-sm flex-1 leading-6">{opt.text}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
      </View>

      {/* Hint */}
      {!isAnswered && (
        <View className="mb-5">
          {showHint ? (
            <View className="bg-amber/10 border border-amber/20 rounded-2xl p-4">
              <Text className="text-amber/70 text-xs uppercase tracking-widest mb-1">Hint</Text>
              <Text className="text-slate-300 text-sm leading-6">{quest.hintText}</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => { setShowHint(true); setUsedHint(true); }}
              className="bg-amber/5 border border-amber/20 rounded-2xl px-4 py-3"
            >
              <Text className="text-amber text-sm">💡 Prikaži hint (-10 bonus bodova)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Submit */}
      {!isAnswered && (
        <TouchableOpacity
          disabled={!selectedOptionId || submitting}
          onPress={() => void handleSubmit()}
          className="w-full bg-cyan rounded-2xl py-4 items-center mb-6"
          style={{ opacity: !selectedOptionId || submitting ? 0.5 : 1 }}
        >
          {submitting ? (
            <ActivityIndicator color="#04111f" />
          ) : (
            <Text className="text-[#04111f] font-semibold text-sm">Potvrdi odgovor</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Result */}
      {(result || alreadyCompleted) && (
        <View
          style={{
            borderColor: (result?.correct ?? true) ? "rgba(19,209,138,0.25)" : "rgba(239,93,168,0.25)",
            backgroundColor: (result?.correct ?? true) ? "rgba(19,209,138,0.07)" : "rgba(239,93,168,0.07)",
          }}
          className="border rounded-3xl p-5 mb-4"
        >
          {result && (
            <View className="flex-row items-center gap-3 mb-4">
              <Text className="text-2xl">{result.correct ? "✅" : "❌"}</Text>
              <View>
                <Text className="text-white font-semibold">{result.correct ? "Tačno!" : "Netačno"}</Text>
                <Text className="text-slate-400 text-sm">{result.correct ? `+${result.score} bodova` : "0 bodova"}</Text>
              </View>
            </View>
          )}

          {alreadyCompleted && !result && (
            <View className="mb-4">
              <Text className="text-white font-semibold">Quest već završen</Text>
              <Text className="text-slate-400 text-sm">Pogledaj povratnu informaciju ispod.</Text>
            </View>
          )}

          <Text className="text-slate-500 text-xs uppercase tracking-widest mb-1">Objašnjenje</Text>
          <Text className="text-slate-300 text-sm leading-7 mb-4">
            {result?.feedbackCorrect ?? ""}
          </Text>

          <View className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-cyan/70 text-xs uppercase tracking-widest mb-1">Zapamti</Text>
            <Text className="text-cyan text-sm font-medium">{result?.miniConclusion ?? quest.miniConclusion}</Text>
          </View>

          {result?.earnedBadges.length ? (
            <View className="bg-violet/10 border border-violet/20 rounded-xl px-4 py-3 mb-4">
              <Text className="text-violet/70 text-xs uppercase tracking-widest mb-2">Novi bedževi!</Text>
              <View className="flex-row gap-3 flex-wrap">
                {result.earnedBadges.map((b) => (
                  <View key={b.name} className="flex-row items-center gap-2">
                    <Text>{b.icon}</Text>
                    <Text className="text-white text-sm font-semibold">{b.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Navigation buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 border border-white/15 rounded-2xl py-3 items-center"
              onPress={() => router.push("/(tabs)/missions")}
            >
              <Text className="text-slate-300 text-sm font-medium">← Misije</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-cyan rounded-2xl py-3 items-center"
              onPress={() => router.push("/(tabs)/")}
            >
              <Text className="text-[#04111f] text-sm font-semibold">Dashboard →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
