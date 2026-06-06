import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/auth-context";
import { apiGetScenarios, type ScenarioSummary } from "../../lib/api";

const DIFF_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  easy: { text: "#34D399", border: "rgba(52,211,153,0.2)", bg: "rgba(52,211,153,0.1)" },
  medium: { text: "#FBBF24", border: "rgba(251,191,36,0.2)", bg: "rgba(251,191,36,0.1)" },
  hard: { text: "#F87171", border: "rgba(248,113,113,0.2)", bg: "rgba(248,113,113,0.1)" },
};
const DIFF_LABELS: Record<string, string> = { easy: "Lako", medium: "Srednje", hard: "Teško" };

const TYPE_ICONS: Record<string, string> = {
  odluka: "🎯",
  phishing_inbox: "📧",
  lozinka: "⚒️",
  razvrstaj: "🔀",
  pravo_lazno: "🔍",
  razgovor: "💬",
  podesi: "⚙️",
  brzi_krug: "⚡",
};
const TYPE_LABELS: Record<string, string> = {
  odluka: "Odluka",
  phishing_inbox: "Phishing Inbox",
  lozinka: "Kovačnica",
  razvrstaj: "Razvrstaj",
  pravo_lazno: "Pravo ili Lažno",
  razgovor: "Razgovor",
  podesi: "Podesi zaštitu",
  brzi_krug: "Brzi krug",
};

export default function MissionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiGetScenarios()
      .then(setScenarios)
      .catch(() => setError("Nije moguće učitati misije."))
      .finally(() => setLoading(false));
  }, [user]);

  // Group by discipline
  const topicMap = new Map<string, { slug: string; name: string; icon: string; items: ScenarioSummary[] }>();
  for (const s of scenarios) {
    const key = s.discipline.slug;
    if (!topicMap.has(key)) topicMap.set(key, { ...s.discipline, items: [] });
    topicMap.get(key)!.items.push(s);
  }
  const topics = Array.from(topicMap.values());
  const filtered = filter ? topics.filter((t) => t.slug === filter) : topics;

  const completed = scenarios.filter((s) => s.completed).length;

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20, paddingHorizontal: 16 }}
      >
        {/* Header */}
        <Text style={{ color: "rgba(34,211,238,0.75)", fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>Mapa misija</Text>
        <Text style={{ color: "#E5ECF5", fontSize: 28, fontWeight: "800", marginTop: 4 }}>Misije</Text>
        <Text style={{ color: "#8A97AD", fontSize: 14, marginTop: 4, marginBottom: 16 }}>
          {completed} / {scenarios.length} završeno
        </Text>

        {error ? (
          <View style={{ backgroundColor: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.2)", borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <Text style={{ color: "#F87171" }}>{error}</Text>
          </View>
        ) : null}

        {/* Topic filter pills */}
        {topics.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setFilter(null)}
                style={{
                  borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
                  backgroundColor: !filter ? "#22D3EE" : "#141A2A",
                  borderWidth: 1, borderColor: !filter ? "#22D3EE" : "#26304A",
                }}
              >
                <Text style={{ color: !filter ? "#0B0F1A" : "#8A97AD", fontSize: 13, fontWeight: "600" }}>Sve</Text>
              </TouchableOpacity>
              {topics.map((t) => (
                <TouchableOpacity
                  key={t.slug}
                  onPress={() => setFilter(filter === t.slug ? null : t.slug)}
                  style={{
                    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
                    backgroundColor: filter === t.slug ? "#22D3EE" : "#141A2A",
                    borderWidth: 1, borderColor: filter === t.slug ? "#22D3EE" : "#26304A",
                    flexDirection: "row", alignItems: "center", gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 12 }}>{t.icon}</Text>
                  <Text style={{ color: filter === t.slug ? "#0B0F1A" : "#8A97AD", fontSize: 12, fontWeight: "600" }}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {loading ? (
          <ActivityIndicator color="#22D3EE" />
        ) : (
          <View style={{ gap: 24 }}>
            {filtered.map((topic) => {
              const doneCount = topic.items.filter((s) => s.completed).length;
              return (
                <View key={topic.slug}>
                  {/* Topic header */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(34,211,238,0.1)", borderWidth: 1, borderColor: "rgba(34,211,238,0.2)", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 20 }}>{topic.icon}</Text>
                    </View>
                    <View>
                      <Text style={{ color: "#E5ECF5", fontSize: 17, fontWeight: "700" }}>{topic.name}</Text>
                      <Text style={{ color: "#8A97AD", fontSize: 12 }}>{doneCount} / {topic.items.length} završeno</Text>
                    </View>
                    {doneCount === topic.items.length && topic.items.length > 0 && (
                      <View style={{ marginLeft: "auto", backgroundColor: "rgba(52,211,153,0.15)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(52,211,153,0.3)" }}>
                        <Text style={{ color: "#34D399", fontSize: 11, fontWeight: "700" }}>✓ Sve</Text>
                      </View>
                    )}
                  </View>

                  {/* Scenario cards */}
                  <View style={{ gap: 8 }}>
                    {topic.items.map((s) => {
                      const diffCfg = DIFF_COLORS[s.difficulty];
                      const typeIcon = TYPE_ICONS[s.interactionType] ?? "🎮";
                      const typeLabel = TYPE_LABELS[s.interactionType] ?? s.interactionType;

                      return (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => router.push(`/game/${s.id}`)}
                          style={{
                            backgroundColor: s.completed ? "rgba(52,211,153,0.05)" : "#141A2A",
                            borderColor: s.completed ? "rgba(52,211,153,0.25)" : "#26304A",
                            borderWidth: 1, borderRadius: 14, padding: 14,
                          }}
                        >
                          {/* Top row: difficulty + status */}
                          <View style={{ flexDirection: "row", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                            {diffCfg && (
                              <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: diffCfg.border, backgroundColor: diffCfg.bg }}>
                                <Text style={{ color: diffCfg.text, fontSize: 11, fontWeight: "700" }}>{DIFF_LABELS[s.difficulty]}</Text>
                              </View>
                            )}
                            <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: "#26304A", backgroundColor: "#1C2436" }}>
                              <Text style={{ color: "#8A97AD", fontSize: 11 }}>{typeIcon} {typeLabel}</Text>
                            </View>
                            {s.completed && (
                              <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.1)" }}>
                                <Text style={{ color: "#34D399", fontSize: 11, fontWeight: "700" }}>✓ Završeno</Text>
                              </View>
                            )}
                          </View>

                          {/* Title + XP */}
                          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                            <Text style={{ color: "#E5ECF5", fontSize: 15, fontWeight: "600", flex: 1, marginRight: 8, lineHeight: 22 }}>{s.title}</Text>
                            <View style={{ alignItems: "flex-end" }}>
                              <Text style={{ color: "#22D3EE", fontWeight: "700", fontSize: 14 }}>+{s.xp}</Text>
                              <Text style={{ color: "#8A97AD", fontSize: 11 }}>XP</Text>
                            </View>
                          </View>

                          <Text style={{ color: "#22D3EE", fontSize: 13, fontWeight: "600", marginTop: 6 }}>
                            {s.completed ? "Ponovi →" : "Igraj →"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {scenarios.length === 0 && !loading && (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>🗺️</Text>
                <Text style={{ color: "#E5ECF5", fontSize: 16, fontWeight: "600" }}>Nema misija</Text>
                <Text style={{ color: "#8A97AD", fontSize: 13, marginTop: 4, textAlign: "center" }}>
                  Misije se učitavaju nakon pokretanja backend servisa.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
