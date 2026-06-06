import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/auth-context";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri prijavi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Logo */}
          <View className="mb-10">
            <View className="w-14 h-14 rounded-2xl bg-cyan/20 items-center justify-center mb-4">
              <Text className="text-2xl">⛨</Text>
            </View>
            <Text className="text-white text-2xl font-bold">CyberSafety</Text>
            <Text className="text-slate-500 text-xs tracking-widest uppercase mt-0.5">Adventure Game</Text>
          </View>

          {/* Card */}
          <View className="bg-panel border border-cyan/20 rounded-3xl p-6">
            <Text className="text-white text-2xl font-bold mb-1">Dobrodošao nazad</Text>
            <Text className="text-slate-400 text-sm mb-6">Nastavi svoju cyber avanturu.</Text>

            {/* Email */}
            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-2">Email</Text>
            <TextInput
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm mb-4"
              placeholder="agent@example.com"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {/* Password */}
            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-2">Lozinka</Text>
            <TextInput
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm mb-4"
              placeholder="••••••••"
              placeholderTextColor="#475569"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {/* Error */}
            {error ? (
              <View className="bg-rose/10 border border-rose/20 rounded-2xl px-4 py-3 mb-4">
                <Text className="text-rose text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Button */}
            <TouchableOpacity
              className="w-full bg-cyan rounded-2xl py-4 items-center mt-1"
              onPress={() => void handleLogin()}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#04111f" />
              ) : (
                <Text className="text-[#04111f] font-semibold text-sm">Prijavi se</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-6 gap-1">
            <Text className="text-slate-400 text-sm">Nemaš nalog?</Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text className="text-cyan text-sm">Registruj se</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
