import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/auth-context";
import { apiGetQuests, type QuestSummary } from "../../lib/api";

const DIFFICULTY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  easy: { text: "#13d18a", border: "rgba(19,209,138,0.2)", bg: "rgba(19,209,138,0.1)" },
  medium: { text: "#f5b942", border: "rgba(245,185,66,0.2)", bg: "rgba(245,185,66,0.1)" },
  hard: { text: "#ef5da8", border: "rgba(239,93,168,0.2)", bg: "rgba(239,93,168,0.1)" },
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Lako", medium: "Srednje", hard: "Teško",
};

const STATUS_CONFIG: Record<string, { label: string; text: string; border: string; bg: string }> = {
  available: { label: "Dostupno", text: "#37d6ff", border: "rgba(55,214,255,0.2)", bg: "rgba(55,214,255,0.1)" },
  locked: { label: "Zaključano", text: "#475569", border: "rgba(255,255,255,0.1)", bg: "rgba(255,255,255,0.05)" },
  completed: { label: "Završeno", text: "#13d18a", border: "rgba(19,209,138,0.2)", bg: "rgba(19,209,138,0.1)" },
  mastered: { label: "Savladano", text: "#8b5cf6", border: "rgba(139,92,246,0.2)", bg: "rgba(139,92,246,0.1)" },
};

function Badge({ label, textColor, borderColor, bgColor }: { label: string; textColor: string; borderColor: string; bgColor: string }) {
  return (
    <View style={{ borderColor, backgroundColor: bgColor }} className="border rounded-full px-2.5 py-0.5">
      <Text style={{ color: textColor }} className="text-[11px] font-semibold">{label}</Text>
    </View>
  );
}

export default function MissionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiGetQuests()
      .then(setQuests)
      .catch(() => setError("Nije moguće učitati misije."))
      .finally(() => setLoading(false));
  }, [user]);

  const disciplineMap = new Map<string, { info: QuestSummary["discipline"]; quests: QuestSummary[] }>();
  for (const q of quests) {
    if (!disciplineMap.has(q.discipline.slug)) {
      disciplineMap.set(q.discipline.slug, { info: q.discipline, quests: [] });
    }
    disciplineMap.get(q.discipline.slug)!.quests.push(q);
  }
  const disciplines = Array.from(disciplineMap.values());

  return (
    <ScrollView
      className="flex-1 bg-bg"
      style={{ backgroundColor: "#050816" }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 16 }}
    >
      {/* Header */}
      <Text className="text-cyan/75 text-xs uppercase tracking-widest">Mapa misija</Text>
      <Text className="text-white text-3xl font-bold mt-1">Discipline</Text>
      <Text className="text-slate-400 text-base mt-1 mb-7">
        {quests.filter(q => q.status === "completed" || q.status === "mastered").length} / {quests.length} misija završeno
      </Text>

      {error ? (
        <View className="bg-rose/10 border border-rose/20 rounded-2xl px-4 py-3 mb-6">
          <Text className="text-rose text-sm">{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color="#37d6ff" />
      ) : (
        <View className="gap-8">
          {disciplines.map(({ info, quests: dQuests }) => {
            const completed = dQuests.filter(q => q.status === "completed" || q.status === "mastered").length;
            return (
              <View key={info.slug}>
                {/* Discipline header */}
                <View className="flex-row items-center gap-3 mb-4">
                  <View className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
                    <Text className="text-xl">{info.icon}</Text>
                  </View>
                  <View>
                    <Text className="text-white text-lg font-semibold">{info.name}</Text>
                    <Text className="text-slate-400 text-sm">{completed} / {dQuests.length} završeno</Text>
                  </View>
                </View>

                {/* Quest cards */}
                <View className="gap-3">
                  {[...dQuests]
                    .sort((a, b) => a.orderInDiscipline - b.orderInDiscipline)
                    .map((q) => {
                      const isLocked = q.status === "locked";
                      const statusCfg = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.locked;
                      const diffCfg = DIFFICULTY_COLORS[q.difficulty];

                      return (
                        <TouchableOpacity
                          key={q.id}
                          disabled={isLocked}
                          onPress={() => router.push(`/quest/${q.id}`)}
                          className="bg-panel border border-white/10 rounded-2xl p-4"
                          style={{ opacity: isLocked ? 0.5 : 1 }}
                        >
                          {/* Badges row */}
                          <View className="flex-row gap-2 mb-3 flex-wrap">
                            {diffCfg && (
                              <Badge
                                label={DIFFICULTY_LABELS[q.difficulty] ?? q.difficulty}
                                textColor={diffCfg.text}
                                borderColor={diffCfg.border}
                                bgColor={diffCfg.bg}
                              />
                            )}
                            <Badge
                              label={statusCfg.label}
                              textColor={statusCfg.text}
                              borderColor={statusCfg.border}
                              bgColor={statusCfg.bg}
                            />
                          </View>

                          <View className="flex-row items-start justify-between">
                            <Text className="text-white text-base font-semibold flex-1 mr-2">{q.title}</Text>
                            {isLocked ? (
                              <Text className="text-lg">🔒</Text>
                            ) : q.status === "mastered" ? (
                              <Text className="text-lg">⭐</Text>
                            ) : q.status === "completed" ? (
                              <Text className="text-lg">✅</Text>
                            ) : null}
                          </View>

                          <View className="flex-row items-center justify-between mt-2">
                            <Text className="text-slate-400 text-sm">
                              {q.score !== null ? `${q.score} bodova` : `Do ${q.basePoints + 25} bodova`}
                            </Text>
                            {!isLocked && (
                              <Text className="text-cyan text-sm font-medium">
                                {q.status === "completed" || q.status === "mastered" ? "Ponovi →" : "Igraj →"}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
