import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/auth-context";
import { apiGetProgress, type ProgressData } from "../../lib/api";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="flex-1 bg-panelSoft border border-white/10 rounded-2xl p-4 items-center">
      <Text className="text-white text-xl font-bold">{value}</Text>
      <Text className="text-slate-500 text-xs uppercase tracking-widest mt-1">{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiGetProgress()
      .then(setProgress)
      .catch(() => setError("Nije moguće učitati podatke."));
  }, [user]);

  if (!user) return null;

  const p = progress;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 16 }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-8">
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-xl bg-cyan/20 items-center justify-center">
            <Text>⛨</Text>
          </View>
          <Text className="text-white font-semibold text-base">CyberSafety</Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          className="border border-white/10 rounded-xl px-3 py-1.5"
        >
          <Text className="text-slate-400 text-xs">Odjavi se</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View className="bg-rose/10 border border-rose/20 rounded-2xl px-4 py-3 mb-6">
          <Text className="text-rose text-sm">{error}</Text>
        </View>
      ) : null}

      {/* Welcome */}
      <Text className="text-cyan/75 text-xs uppercase tracking-widest">Agent status</Text>
      <Text className="text-white text-3xl font-bold mt-1">Zdravo, {user.username} 👋</Text>
      <Text className="text-slate-400 text-base mt-1">
        {p?.profile.status ?? user.status} · Level {p?.profile.level ?? user.level}
      </Text>

      {/* Stats */}
      <View className="flex-row gap-3 mt-6">
        <StatCard label="Bodovi" value={(p?.profile.points ?? user.points).toLocaleString()} />
        <StatCard label="Streak" value={`${p?.profile.streak ?? user.streak}d`} />
      </View>
      <View className="flex-row gap-3 mt-3">
        <StatCard
          label="Questovi"
          value={`${p?.stats.completedQuests ?? 0}/${p?.stats.totalQuests ?? 0}`}
        />
        <StatCard label="Bedževi" value={p?.stats.badgesCount ?? 0} />
      </View>

      {/* XP Bar */}
      <View className="bg-panel border border-cyan/20 rounded-3xl p-5 mt-6">
        <View className="flex-row justify-between mb-2">
          <Text className="text-slate-400 text-sm">Do sljedećeg nivoa</Text>
          <Text className="text-white font-semibold text-sm">{p?.stats.xpPercentage ?? 0}%</Text>
        </View>
        <View className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <LinearGradient
            colors={["#37d6ff", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: "100%", width: `${p?.stats.xpPercentage ?? 0}%`, borderRadius: 99 }}
          />
        </View>
        <Text className="text-slate-500 text-xs mt-2">
          {p?.stats.xpToNextLevel ?? 0} XP do Level {(p?.profile.level ?? user.level) + 1}
        </Text>
      </View>

      {/* Quick actions */}
      <Text className="text-white text-lg font-semibold mt-7 mb-4">Brze akcije</Text>
      <View className="gap-3">
        {p?.nextRecommended ? (
          <TouchableOpacity
            className="bg-panel border border-cyan/20 rounded-2xl p-5"
            onPress={() => router.push(`/quest/${p.nextRecommended!.id}`)}
          >
            <Text className="text-cyan/70 text-xs uppercase tracking-widest">Nastavi</Text>
            <Text className="text-white text-base font-semibold mt-1">{p.nextRecommended.title}</Text>
            <Text className="text-slate-400 text-sm mt-0.5">{p.nextRecommended.discipline}</Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-panel border border-white/10 rounded-2xl p-5">
            <Text className="text-green/70 text-xs uppercase tracking-widest">Završeno</Text>
            <Text className="text-white text-base font-semibold mt-1">Sve misije završene!</Text>
          </View>
        )}

        <TouchableOpacity
          className="bg-panel border border-violet/20 rounded-2xl p-5"
          onPress={() => router.push("/(tabs)/missions")}
        >
          <Text className="text-violet/70 text-xs uppercase tracking-widest">Mapa</Text>
          <Text className="text-white text-base font-semibold mt-1">Sve misije</Text>
          <Text className="text-slate-400 text-sm mt-0.5">Pregled svih disciplina i questova.</Text>
        </TouchableOpacity>
      </View>

      {/* Badges */}
      {p?.badges.length ? (
        <View className="mt-7">
          <Text className="text-white text-lg font-semibold mb-4">Bedževi</Text>
          <View className="flex-row flex-wrap gap-3">
            {p.badges.map((b) => (
              <View key={b.id} className="bg-panel border border-white/10 rounded-2xl p-3 items-center w-20">
                <Text className="text-2xl">{b.icon}</Text>
                <Text className="text-white text-xs font-medium mt-1 text-center" numberOfLines={2}>{b.name}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
