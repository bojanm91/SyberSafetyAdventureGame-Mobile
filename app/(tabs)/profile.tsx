import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/auth-context";
import { apiGetProgress, type ProgressData } from "../../lib/api";

const DISCIPLINE_NAMES: Record<string, string> = {
  "password-base": "Password Base",
  "phishing-harbor": "Phishing Harbor",
  "privacy-zone": "Privacy Zone",
  "malware-lab": "Malware Lab",
  "social-engineering": "Social Engineering",
  "final-challenge": "Final Cyber Challenge",
};

const DISCIPLINE_ICONS: Record<string, string> = {
  "password-base": "⌘",
  "phishing-harbor": "✉",
  "privacy-zone": "◉",
  "malware-lab": "⚠",
  "social-engineering": "⌬",
  "final-challenge": "▣",
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    if (!user) return;
    apiGetProgress().then(setProgress).catch(console.error);
  }, [user]);

  if (!user) return null;
  const p = progress;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 16 }}
    >
      {/* Profile card */}
      <View className="bg-panel border border-cyan/20 rounded-3xl p-6 mb-6">
        <View className="flex-row items-start gap-4">
          <View className="w-16 h-16 rounded-2xl bg-cyan/15 items-center justify-center">
            <Text className="text-3xl">🛡️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-cyan/75 text-xs uppercase tracking-widest">Cyber Agent</Text>
            <Text className="text-white text-2xl font-bold mt-0.5">{user.username}</Text>
            <Text className="text-slate-400 text-sm mt-0.5">{p?.profile.email ?? user.email}</Text>
            <View className="flex-row flex-wrap gap-2 mt-3">
              <View className="bg-cyan/10 border border-cyan/20 rounded-full px-3 py-1">
                <Text className="text-cyan text-xs font-semibold">{p?.profile.status ?? user.status}</Text>
              </View>
              <View className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Text className="text-slate-300 text-xs font-semibold">Level {p?.profile.level ?? user.level}</Text>
              </View>
              <View className="bg-amber/10 border border-amber/20 rounded-full px-3 py-1">
                <Text className="text-amber text-xs font-semibold">🔥 {p?.profile.streak ?? user.streak} dana</Text>
              </View>
            </View>
          </View>
          <View>
            <Text className="text-white text-2xl font-bold text-right">
              {(p?.profile.points ?? user.points).toLocaleString()}
            </Text>
            <Text className="text-slate-500 text-xs text-right">bodova</Text>
          </View>
        </View>

        {p && (
          <View className="mt-5">
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-400 text-sm">XP do Level {p.profile.level + 1}</Text>
              <Text className="text-white text-sm font-semibold">{p.stats.xpPercentage}%</Text>
            </View>
            <View className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <LinearGradient
                colors={["#37d6ff", "#8b5cf6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: "100%", width: `${p.stats.xpPercentage}%`, borderRadius: 99 }}
              />
            </View>
          </View>
        )}
      </View>

      {/* Stats grid */}
      {p && (
        <View className="flex-row flex-wrap gap-3 mb-6">
          {[
            { label: "Bodovi", value: p.profile.points.toLocaleString() },
            { label: "Bedževi", value: p.stats.badgesCount },
            { label: "Završeni", value: `${p.stats.completedQuests}/${p.stats.totalQuests}` },
            { label: "Streak", value: `${p.profile.streak}d` },
          ].map((s) => (
            <View key={s.label} className="bg-panel border border-white/10 rounded-2xl p-4 items-center" style={{ width: "47%" }}>
              <Text className="text-white text-xl font-bold">{s.value}</Text>
              <Text className="text-slate-500 text-xs uppercase tracking-widest mt-1">{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Discipline progress */}
      {p && Object.keys(p.disciplineStats).length > 0 && (
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Napredak po disciplinama</Text>
          <View className="gap-3">
            {Object.entries(p.disciplineStats).map(([slug, stats]) => {
              const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              return (
                <View key={slug} className="bg-panel border border-white/10 rounded-2xl p-4">
                  <View className="flex-row items-center justify-between mb-2.5">
                    <View className="flex-row items-center gap-2">
                      <Text>{DISCIPLINE_ICONS[slug] ?? "◎"}</Text>
                      <Text className="text-white text-sm font-medium">
                        {DISCIPLINE_NAMES[slug] ?? slug}
                      </Text>
                    </View>
                    <Text className="text-slate-400 text-xs">
                      {stats.completed}/{stats.total} · {stats.points}p
                    </Text>
                  </View>
                  <View className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <LinearGradient
                      colors={["#37d6ff", "#8b5cf6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: "100%", width: `${pct}%`, borderRadius: 99 }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Badges */}
      <View className="mb-6">
        <Text className="text-white text-lg font-semibold mb-4">Bedževi ({p?.badges.length ?? 0})</Text>
        {p?.badges.length ? (
          <View className="flex-row flex-wrap gap-3">
            {p.badges.map((b) => (
              <View key={b.id} className="bg-panel border border-white/10 rounded-2xl p-4 flex-row items-center gap-3" style={{ width: "47%" }}>
                <Text className="text-3xl">{b.icon}</Text>
                <View className="flex-1">
                  <Text className="text-white text-sm font-semibold" numberOfLines={1}>{b.name}</Text>
                  <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={2}>{b.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-panel border border-white/10 rounded-2xl p-8 items-center">
            <Text className="text-3xl mb-3">🏅</Text>
            <Text className="text-slate-400 text-sm text-center">Završi questove da osvoji bedževe.</Text>
            <TouchableOpacity
              className="mt-4 bg-cyan rounded-2xl px-5 py-2.5"
              onPress={() => router.push("/(tabs)/missions")}
            >
              <Text className="text-[#04111f] font-semibold text-sm">Idi na misije</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity
        className="border border-white/10 rounded-2xl py-3.5 items-center"
        onPress={logout}
      >
        <Text className="text-slate-400 text-sm">Odjavi se</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
